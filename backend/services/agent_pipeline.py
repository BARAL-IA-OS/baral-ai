# backend/services/agent_pipeline.py
"""Pipeline de 3 agentes: Orquestador -> Copywriter -> Revisor.

- Orquestador: filtra clientes de la DB segun la receta y sus parametros (en codigo).
- Copywriter:  genera el email plantilla (LLM, o fallback determinista sin costo).
- Revisor:     puntua 0-10 y verifica prohibiciones; si score < 7 regenera 1 vez.

Cap de costo: maximo 3 llamadas al LLM por tarea (copywriter, revisor, +1 regen).
"""
from datetime import date, datetime

from prompts.copywriter import COPYWRITER_SYSTEM
from prompts.orchestrator import (
    RECIPES,
    build_copywriter_user_prompt,
    build_reviewer_user_prompt,
)
from prompts.reviewer import REVIEWER_SYSTEM
from services.llm_service import LLMResult, LLMService, LLMUnavailable

MIN_SCORE = 7  # por debajo de esto, se regenera una vez


def _parse_date(value) -> date | None:
    if not value:
        return None
    if isinstance(value, date):
        return value
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(str(value)[:10], fmt).date()
        except ValueError:
            continue
    return None


def _days_since(value) -> int | None:
    d = _parse_date(value)
    return (date.today() - d).days if d else None


def _dias_param(params: dict, *keys: str, default: int) -> int:
    """Toma el primer parametro de dias disponible (acepta nombre especifico o 'dias' generico)."""
    for key in keys:
        value = params.get(key)
        if value is not None:
            return int(value)
    return default


def filter_recipients(recipe_type: str, params: dict, clients: list[dict]) -> list[dict]:
    """Orquestador: selecciona los clientes objetivo segun la receta."""
    params = params or {}

    if recipe_type == "reactivacion":
        dias = _dias_param(params, "dias_inactivo", "dias", default=60)
        out = []
        for c in clients:
            since = _days_since(c.get("ultima_compra"))
            if since is not None and since >= dias:
                out.append(c)
        return out

    if recipe_type == "postventa":
        dias = _dias_param(params, "dias_postventa", "dias", default=7)
        out = []
        for c in clients:
            since = _days_since(c.get("ultima_compra"))
            if since is not None and 0 <= since <= dias:
                out.append(c)
        return out

    if recipe_type == "bienvenida":
        dias = _dias_param(params, "dias_registro", "dias", default=7)
        out = []
        for c in clients:
            since = _days_since(c.get("created_at"))
            # cliente nuevo: registrado hace poco, o sin compras registradas
            if (since is not None and since <= dias) or not c.get("ultima_compra"):
                out.append(c)
        return out

    # lanzamiento / propuesta: toda la base
    return list(clients)


# ---- Copywriter --------------------------------------------------------------

def _copywriter_llm(llm, recipe_type, params, brand, sample, n) -> LLMResult:
    user = build_copywriter_user_prompt(recipe_type, params, brand, sample, n)
    return llm.complete_json(COPYWRITER_SYSTEM, user, temperature=0.4, max_tokens=700)


def _copywriter_fallback(recipe_type, brand) -> dict:
    """Genera un borrador razonable SIN IA (cuando no hay API keys)."""
    nombre = "{{nombre}}"
    empresa = brand.get("industria", "nuestra empresa")
    propuesta = brand.get("propuesta", "lo que necesitas")
    plantillas = {
        "reactivacion": {
            "asunto": f"{nombre}, te extranamos",
            "cuerpo": f"Hace tiempo que no sabemos de ti. En {empresa} preparamos algo pensado para que vuelvas a disfrutar de {propuesta}.",
            "cta": "Volver ahora",
        },
        "bienvenida": {
            "asunto": f"Bienvenido, {nombre}",
            "cuerpo": f"Gracias por unirte. En {empresa} nos enfocamos en {propuesta}. Estamos para ayudarte a empezar.",
            "cta": "Conocer mas",
        },
        "postventa": {
            "asunto": f"{nombre}, gracias por tu compra",
            "cuerpo": "Queremos saber como te fue con tu compra. Tu opinion nos ayuda a mejorar.",
            "cta": "Dejar mi opinion",
        },
        "lanzamiento": {
            "asunto": "Tenemos algo nuevo para ti",
            "cuerpo": f"En {empresa} acabamos de lanzar una novedad alineada con {propuesta}. Te contamos los detalles.",
            "cta": "Ver la novedad",
        },
        "propuesta": {
            "asunto": f"Una propuesta para ti, {nombre}",
            "cuerpo": f"Preparamos una propuesta a tu medida basada en {propuesta}.",
            "cta": "Ver propuesta",
        },
    }
    base = plantillas.get(recipe_type, plantillas["reactivacion"])
    return {"saludo": f"Hola {nombre},", **base}


# ---- Revisor -----------------------------------------------------------------

def _reviewer_llm(llm, brand, draft) -> LLMResult:
    user = build_reviewer_user_prompt(brand, draft)
    return llm.complete_json(REVIEWER_SYSTEM, user, temperature=0.0, max_tokens=300)


def _reviewer_fallback(brand, draft) -> dict:
    """Revision heuristica sin IA: penaliza si aparecen palabras prohibidas."""
    prohibidas = [
        p.strip().lower()
        for p in (brand.get("prohibiciones", "") or "").replace(";", ",").split(",")
        if p.strip()
    ]
    texto = " ".join(str(draft.get(k, "")) for k in ("asunto", "saludo", "cuerpo", "cta")).lower()
    usadas = [p for p in prohibidas if p and p in texto]
    if usadas:
        return {"score": 4, "issues": [f"Usa palabra prohibida: {p}" for p in usadas], "prohibited_used": True}
    return {"score": 8, "issues": [], "prohibited_used": False}


# ---- Pipeline completo -------------------------------------------------------

def run_pipeline(recipe_type: str, params: dict, brand: dict, clients: list[dict]) -> dict:
    """Ejecuta el pipeline completo y devuelve el resultado para persistir."""
    if recipe_type not in RECIPES:
        raise ValueError(f"Receta desconocida: {recipe_type}")

    recipients = filter_recipients(recipe_type, params, clients)
    sample = recipients[0] if recipients else (clients[0] if clients else None)

    llm = LLMService()
    tokens = 0
    cost = 0.0
    provider = "stub"

    def _generate() -> dict:
        nonlocal tokens, cost, provider
        if llm.available:
            try:
                res = _copywriter_llm(llm, recipe_type, params, brand, sample, len(recipients))
                tokens += res.tokens
                cost += res.cost_usd
                provider = res.provider
                return res.data
            except LLMUnavailable:
                pass
        return _copywriter_fallback(recipe_type, brand)

    def _review(draft) -> dict:
        nonlocal tokens, cost
        if llm.available:
            try:
                res = _reviewer_llm(llm, brand, draft)
                tokens += res.tokens
                cost += res.cost_usd
                return res.data
            except LLMUnavailable:
                pass
        return _reviewer_fallback(brand, draft)

    draft = _generate()
    review = _review(draft)
    score = int(review.get("score", 0) or 0)

    # Regenera una vez si el score es bajo (cap de costo respetado)
    if score < MIN_SCORE:
        draft = _generate()
        review = _review(draft)
        score = int(review.get("score", 0) or 0)

    return {
        "draft_content": {
            "asunto": draft.get("asunto", ""),
            "saludo": draft.get("saludo", ""),
            "cuerpo": draft.get("cuerpo", ""),
            "cta": draft.get("cta", ""),
        },
        "recipients": recipients,
        "tokens_used": tokens,
        "cost_usd": round(cost, 6),
        "agent_score": score,
        "provider": provider,
        "review_issues": review.get("issues", []),
    }
