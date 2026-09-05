"""Single enforcement point for clients eligible to receive campaigns."""

from services.db_service import get_supabase


def get_eligible_clients(user_id: str, client_ids: list[str] | None = None) -> list[dict]:
    query = (
        get_supabase()
        .table("clients")
        .select("*")
        .eq("user_id", user_id)
        .neq("lifecycle_status", "do_not_contact")
        .eq("contact_consent", True)
    )
    if client_ids:
        query = query.in_("id", client_ids)
    return query.execute().data or []
