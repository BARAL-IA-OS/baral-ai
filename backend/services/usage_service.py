# backend/services/usage_service.py
"""Registro de gasto de generacion (texto + imagen) por usuario.

Cada generacion registra un evento en la tabla `usage_events`. Si la tabla aun
no existe, el registro se ignora sin romper el flujo (ver SQL en doc/DISTRIBUCION).
"""
from services.db_service import get_supabase


def log_usage(user_id: str, kind: str, provider: str, cost_usd: float, tokens: int = 0, meta: dict | None = None) -> None:
    """Registra un evento de gasto. No falla si la tabla no existe todavia."""
    try:
        get_supabase().table("usage_events").insert(
            {
                "user_id": user_id,
                "kind": kind,               # 'text' | 'image'
                "provider": provider,
                "tokens": tokens,
                "cost_usd": round(cost_usd or 0, 6),
                "meta": meta,
            }
        ).execute()
    except Exception:
        pass  # tabla ausente o error no fatal: no bloquear la generacion


def usage_summary(user_id: str) -> dict:
    """Total gastado por el usuario en generacion, desglosado por tipo."""
    try:
        res = (
            get_supabase()
            .table("usage_events")
            .select("kind,cost_usd,tokens")
            .eq("user_id", user_id)
            .execute()
        )
        rows = res.data or []
    except Exception:
        return {"total_cost_usd": 0.0, "total_events": 0, "by_kind": {}, "available": False}

    by_kind: dict[str, dict] = {}
    total = 0.0
    for r in rows:
        cost = float(r.get("cost_usd") or 0)
        total += cost
        k = r.get("kind") or "otro"
        bucket = by_kind.setdefault(k, {"count": 0, "cost_usd": 0.0, "tokens": 0})
        bucket["count"] += 1
        bucket["cost_usd"] = round(bucket["cost_usd"] + cost, 6)
        bucket["tokens"] += int(r.get("tokens") or 0)

    return {
        "total_cost_usd": round(total, 6),
        "total_events": len(rows),
        "by_kind": by_kind,
        "available": True,
    }
