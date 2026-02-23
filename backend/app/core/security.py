"""
Security module: JWT verification using Supabase.
Auto-creates user profile if it doesn't exist.
"""
from fastapi import Depends, HTTPException, Header
from supabase import create_client
from ..core.config import settings

# Service-role client for backend operations (bypasses RLS)
supabase_admin = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


async def get_current_user(authorization: str = Header(None)):
    """Extract and verify user from the Authorization header."""
    if not authorization:
        print("DEBUG: Missing authorization header")
        raise HTTPException(status_code=401, detail="Missing authorization header")

    token = authorization.replace("Bearer ", "")
    print(f"DEBUG: Verifying token: {token[:10]}...")

    try:
        # Verify the JWT using Supabase auth
        user_response = supabase_admin.auth.get_user(token)
        if not user_response or not user_response.user:
            print("DEBUG: Invalid token response from Supabase")
            raise HTTPException(status_code=401, detail="Invalid token")

        user = user_response.user
        print(f"DEBUG: User verified: {user.id}")

        # Auto-create profile if missing (resilient)
        try:
            profile = supabase_admin.table("profiles").select("id").eq("id", user.id).single().execute()
            if not profile.data:
                print("DEBUG: Profile not found (checked via admin), creating...")
                raise Exception("No profile")
        except Exception:
            try:
                # Create profile
                supabase_admin.table("profiles").upsert({
                    "id": user.id,
                    "full_name": user.user_metadata.get("full_name", "User"),
                    "email": user.email
                }).execute()
                print("DEBUG: Profile created/upserted.")
            except Exception as e:
                print(f"DEBUG: Profile auto-create failed: {e} (Non-fatal)")

        return user
        #         }).execute()
        #         print("DEBUG: Profile upsert successful")
        #     except Exception as upsert_error:
        #         print(f"DEBUG: Profile upsert passed/failed silently: {upsert_error}")
        #         pass

    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Authentication exception: {e}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


async def get_admin_user(user=Depends(get_current_user)):
    """Check if the user has admin role."""
    profile = supabase_admin.table("profiles").select("role").eq("id", user.id).single().execute()
    if not profile.data or profile.data.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
