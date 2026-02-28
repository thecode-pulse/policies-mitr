# pyre-ignore-all-errors
"""
Admin router - analytics, user management, activity logs.
"""
from fastapi import APIRouter, Depends
from app.core.security import get_admin_user, supabase_admin

router = APIRouter(prefix="/api/admin", tags=["admin"]) # type: ignore


@router.get("/analytics")
async def get_analytics(user=Depends(get_admin_user)):
    """Get platform analytics."""
    users = supabase_admin.table("profiles").select("id", count="exact").execute()
    policies = supabase_admin.table("policies").select("id, category, language", count="exact").execute()
    actions = supabase_admin.table("activity_logs").select("id", count="exact").execute()

    # Category breakdown (from policies)
    categories = {}
    if policies.data:
        for p in policies.data:
            cat = p.get("category", "Other") # type: ignore
            categories[cat] = categories.get(cat, 0) + 1

    # Language breakdown (from translation activity)
    languages = {}
    translations = supabase_admin.table("activity_logs").select("details").eq("action_type", "translated").execute()
    if translations.data:
        for t in translations.data:
            details = t.get("details") or {}
            lang = details.get("target_language") if isinstance(details, dict) else None
            if lang:
                languages[lang] = languages.get(lang, 0) + 1

    return {
        "total_users": users.count or 0,
        "total_policies": policies.count or 0,
        "total_actions": actions.count or 0,
        "categories": categories,
        "languages": [{"language": lang, "count": count} for lang, count in languages.items()],
    }


@router.get("/users")
async def get_users(user=Depends(get_admin_user)):
    """List all users."""
    result = supabase_admin.table("profiles").select("*").order("created_at", desc=True).execute()
    return result.data or []


@router.get("/activity")
async def get_activity(user=Depends(get_admin_user)):
    """Get recent activity."""
    result = supabase_admin.table("activity_logs") \
        .select("*") \
        .order("created_at", desc=True) \
        .limit(50) \
        .execute()
    return result.data or []
