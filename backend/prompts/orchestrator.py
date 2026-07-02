# backend/prompts/orchestrator.py
"""Descripcion de cada receta para construir el contexto del Copywriter.

El Orquestador NO llama al LLM: filtra clientes en codigo (agent_pipeline) y
usa estas descripciones para armar el prompt del Copywriter.
"""

RECIPES = {
    "reactivacion": {
        "nombre": "Reactivar clientes inactivos",
        "objetivo": "Recuperar a clientes que no compran hace un tiempo, invitandolos a volver.",
        "param": "dias_inactivo",
    },
    "bienvenida": {
        "nombre": "Campana de bienvenida",
        "objetivo": "Dar la bienvenida a clientes nuevos y presentar la propuesta de valor.",
        "param": "dias_registro",
    },
    "postventa": {
        "nombre": "Seguimiento post-venta",
        "objetivo": "Dar seguimiento tras una compra reciente y pedir opinion o sugerir el siguiente paso.",
        "param": "dias_postventa",
    },
    "lanzamiento": {
        "nombre": "Lanzamiento de producto o servicio",
        "objetivo": "Anunciar un producto o servicio nuevo a la base de clientes.",
        "param": None,
    },
    "propuesta": {
        "nombre": "Propuesta comercial express",
        "objetivo": "Redactar una propuesta comercial breve para un prospecto.",
        "param": None,
    },
}


def build_copywriter_user_prompt(recipe_type, params, brand, sample_client, n_recipients):
    """Arma el mensaje de usuario para el Copywriter."""
    recipe = RECIPES.get(recipe_type, {"nombre": recipe_type, "objetivo": ""})
    lines = [
        f"TIPO DE CAMPANA: {recipe['nombre']}",
        f"OBJETIVO: {recipe['objetivo']}",
        f"PARAMETROS: {params}",
        f"DESTINATARIOS ESTIMADOS: {n_recipients}",
        "",
        "BRAND BRAIN:",
        f"- Industria: {brand.get('industria', '')}",
        f"- Propuesta de valor: {brand.get('propuesta', '')}",
        f"- Tono: {brand.get('tono', '')}",
        f"- Audiencia: {brand.get('audiencia', '')}",
        f"- Diferenciador: {brand.get('diferenciador', '')}",
        f"- PROHIBICIONES (nunca usar): {brand.get('prohibiciones', '')}",
    ]
    if sample_client:
        lines += [
            "",
            "CLIENTE DE EJEMPLO:",
            f"- Nombre: {sample_client.get('nombre', '')}",
            f"- Ultimo producto: {sample_client.get('producto', 'N/D')}",
            f"- Ultima compra: {sample_client.get('ultima_compra', 'N/D')}",
        ]
    return "\n".join(lines)


def build_reviewer_user_prompt(brand, draft):
    """Arma el mensaje de usuario para el Revisor."""
    return (
        "BRAND BRAIN:\n"
        f"- Tono: {brand.get('tono', '')}\n"
        f"- PROHIBICIONES: {brand.get('prohibiciones', '')}\n\n"
        "BORRADOR A EVALUAR:\n"
        f"- Asunto: {draft.get('asunto', '')}\n"
        f"- Saludo: {draft.get('saludo', '')}\n"
        f"- Cuerpo: {draft.get('cuerpo', '')}\n"
        f"- CTA: {draft.get('cta', '')}\n"
    )
