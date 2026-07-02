# backend/services/db_service.py
"""Cliente de Supabase para el backend.

Usa SUPABASE_SERVICE_KEY (service_role), por lo que BYPASSEA RLS.
Regla de seguridad: cada consulta DEBE filtrar por `user_id` manualmente
(el user_id sale del JWT verificado, ver dependencies/auth.py).
"""
from functools import lru_cache

from supabase import Client, create_client

import config


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """Devuelve un cliente Supabase compartido (singleton)."""
    if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en backend/.env"
        )
    return create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)


def is_configured() -> bool:
    """True si hay credenciales de Supabase (sin exponerlas)."""
    return bool(config.SUPABASE_URL and config.SUPABASE_SERVICE_KEY)
