"""
Policy CRUD and processing router.
Uses BART for summarization + classification, Gemini for translation.
"""
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from app.core.security import get_current_user, supabase_admin
from app.services import pdf as pdf_service
from app.services import summarizer
from app.services import llm as llm_service

router = APIRouter(prefix="/api/policies", tags=["policies"])


@router.post("/upload")
async def upload_policy(
    file: UploadFile = File(...),
    title: str = Form(""),
    language: str = Form("en"),
    privacy_mode: str = Form("false"),
    user=Depends(get_current_user),
):
    print(f"DEBUG UPLOAD: title={title}, language={language}, privacy_mode={privacy_mode}")
    """Upload and process a policy document using BART models."""
    # 1. Read file bytes
    file_bytes = await file.read()
    content_type = file.content_type or ""

    # 2. Extract text
    text = pdf_service.extract_text(file_bytes, content_type)
    if not text or len(text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Could not extract text from the file. Try a different PDF or image.")

    # 3. AI analysis using Gemini (Fast) or fallback to BART
    analysis = await llm_service.analyze_policy_gemini(text)

    # Hindi translation skipped for speed — available on-demand via PolicyViewer

    # 5. Save policy to Supabase
    policy_id = str(uuid.uuid4())
    policy_title = title if title else (file.filename or "Untitled Policy")

    policy_data = {
        "id": policy_id,
        "user_id": user.id,
        "title": policy_title,
        "original_text": text[:50000],
        "summary": analysis.get("summary", ""),
        "simplified": analysis.get("simplified", ""),
        "hindi_summary": analysis.get("hindi_summary", ""),
        "category": analysis.get("category", "Other"),
        "difficulty_score": analysis.get("difficulty_score", 50),
        "ai_confidence": analysis.get("ai_confidence", 0.5),
        "processing_time": analysis.get("processing_time", 0),
        "language": language,
    }

    result = supabase_admin.table("policies").insert(policy_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save policy")

    # 6. Save clauses
    clauses = analysis.get("clauses", [])
    saved_clauses = []
    for clause in clauses:
        clause_data = {
            "id": str(uuid.uuid4()),
            "policy_id": policy_id,
            "clause_number": clause.get("clause_number", 0),
            "clause_text": clause.get("clause_text", ""),
            "explanation": clause.get("explanation", ""),
        }
        try:
            clause_result = supabase_admin.table("clauses").insert(clause_data).execute()
            if clause_result.data:
                saved_clauses.append(clause_result.data[0])
        except Exception:
            pass

    # 7. Log activity (non-critical)
    try:
        supabase_admin.table("activity_logs").insert({
            "id": str(uuid.uuid4()),
            "user_id": user.id,
            "action_type": "upload",
            "details": f"Uploaded: {policy_title}",
        }).execute()
    except Exception:
        pass

    # 8. Return full result
    policy_out = result.data[0]
    policy_out["clauses"] = saved_clauses

    return policy_out


@router.get("/")
async def list_policies(user=Depends(get_current_user)):
    """List all policies for the current user."""
    print(f"DEBUG: Listing policies for user {user.id}")
    try:
        # Try full query first
        # Try full query first
        result = supabase_admin.table("policies") \
            .select("id, title, category, summary, created_at, difficulty_score, ai_confidence, processing_time") \
            .eq("user_id", user.id) \
            .order("created_at", desc=True) \
            .execute()
        
        policies = result.data or []

        # Fetch bookmarks for this user
        try:
            bookmarks_res = supabase_admin.table("bookmarks").select("policy_id").eq("user_id", user.id).execute()
            bookmarked_ids = {b["policy_id"] for b in (bookmarks_res.data or [])}
            
            # Merge
            for p in policies:
                p["is_bookmarked"] = p["id"] in bookmarked_ids
        except Exception as e_b:
            print(f"DEBUG: Failed to fetch bookmarks: {e_b}")
            # Default to False if bookmarks fail, don't crash listing
            for p in policies:
                p["is_bookmarked"] = False

        return policies
    except Exception as e:
        print(f"DEBUG: List policies FAILED: {e}")
        # Try backup query with absolute minimum columns
        try:
            result = supabase_admin.table("policies") \
                .select("id, title, created_at") \
                .eq("user_id", user.id) \
                .order("created_at", desc=True) \
                .execute()
            return result.data or []
        except Exception as e2:
             print(f"DEBUG: Backup query also FAILED: {e2}")
             raise HTTPException(status_code=500, detail=f"Failed to list policies: {str(e)}")


@router.get("/{policy_id}")
async def get_policy(policy_id: str, user=Depends(get_current_user)):
    """Get a specific policy with its clauses."""
    policy = supabase_admin.table("policies") \
        .select("*") \
        .eq("id", policy_id) \
        .eq("user_id", user.id) \
        .single() \
        .execute()

    if not policy.data:
        raise HTTPException(status_code=404, detail="Policy not found")

    clauses = supabase_admin.table("clauses") \
        .select("*") \
        .eq("policy_id", policy_id) \
        .order("clause_number") \
        .execute()

    result = policy.data
    result["clauses"] = clauses.data or []

    # Check bookmark status
    try:
        bookmark_res = supabase_admin.table("bookmarks") \
            .select("id") \
            .eq("user_id", user.id) \
            .eq("policy_id", policy_id) \
            .execute()
        result["is_bookmarked"] = len(bookmark_res.data) > 0 if bookmark_res.data else False
    except Exception:
        result["is_bookmarked"] = False

    return result


@router.post("/{policy_id}/bookmark")
async def toggle_bookmark(policy_id: str, user=Depends(get_current_user)):
    """Toggle bookmark status on a policy."""
    # Check if header exists in bookmarks table
    existing = supabase_admin.table("bookmarks") \
        .select("id") \
        .eq("user_id", user.id) \
        .eq("policy_id", policy_id) \
        .execute()

    if existing.data and len(existing.data) > 0:
        # Delete (Unbookmark)
        supabase_admin.table("bookmarks") \
            .delete() \
            .eq("user_id", user.id) \
            .eq("policy_id", policy_id) \
            .execute()
        new_state = False
    else:
        # Insert (Bookmark)
        supabase_admin.table("bookmarks") \
            .insert({
                "id": str(uuid.uuid4()),
                "user_id": user.id,
                "policy_id": policy_id,
                "created_at": datetime.now().isoformat()
            }) \
            .execute()
        new_state = True

    return {"is_bookmarked": new_state, "policy_id": policy_id}


@router.delete("/{policy_id}")
async def delete_policy(policy_id: str, user=Depends(get_current_user)):
    """Delete a policy."""
    supabase_admin.table("clauses").delete().eq("policy_id", policy_id).execute()
    result = supabase_admin.table("policies").delete().eq("id", policy_id).eq("user_id", user.id).execute()
    return {"message": "Deleted", "id": policy_id}


@router.post("/compare")
async def compare_policies_endpoint(
    data: dict,
    user=Depends(get_current_user),
):
    """Compare two policies."""
    policy_a = supabase_admin.table("policies").select("original_text, title").eq("id", data["policy_id_a"]).single().execute()
    policy_b = supabase_admin.table("policies").select("original_text, title").eq("id", data["policy_id_b"]).single().execute()

    if not policy_a.data or not policy_b.data:
        raise HTTPException(status_code=404, detail="One or both policies not found")

    result = await llm_service.compare_policies(
        policy_a.data["original_text"][:3000],
        policy_b.data["original_text"][:3000],
    )
    return result
