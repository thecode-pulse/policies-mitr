# pyre-ignore-all-errors
"""
Auth router - profile management.
"""
from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user, supabase_admin # type: ignore

router = APIRouter(prefix="/api/auth", tags=["auth"]) # type: ignore


@router.get("/profile")
async def get_profile(user=Depends(get_current_user)):
    """Get current user's profile."""
    result = supabase_admin.table("profiles") \
        .select("*") \
        .eq("id", user.id) \
        .single() \
        .execute()

    if not result.data:
        # Auto-create profile if missing
        profile_data = {
            "id": user.id, # type: ignore
            "email": user.email, # type: ignore
            "full_name": user.user_metadata.get("full_name", "") if user.user_metadata else "", # type: ignore
            "role": "user",
        }
        insert_result = supabase_admin.table("profiles").insert(profile_data).execute()
        return insert_result.data[0] if insert_result.data else profile_data # type: ignore

    return result.data


@router.put("/profile")
async def update_profile(data: dict, user=Depends(get_current_user)):
    """Update current user's profile."""
    allowed_fields = ["full_name", "avatar_url", "preferred_language"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    result = supabase_admin.table("profiles") \
        .update(update_data) \
        .eq("id", user.id) \
        .execute()

    return result.data[0] if result.data else {"message": "Updated"} # type: ignore
