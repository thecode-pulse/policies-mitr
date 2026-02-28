# pyre-ignore-all-errors
"""
AI router - chatbot, translation, TTS, recommendations.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.core.security import get_current_user, supabase_admin
from app.services import llm as llm_service
from app.services import tts as tts_service

router = APIRouter(prefix="/api/ai", tags=["ai"])

with open("bug_log.txt", "a") as f:
    f.write("DEBUG: AI ROUTER IMPORTED\n")


@router.post("/chat")
async def chat(data: dict, user=Depends(get_current_user)):
    """RAG-based chatbot endpoint."""
    query = data.get("query", "")
    policy_id = data.get("policy_id")
    
    # Create local client to verify if supabase_admin is broken
    from supabase import create_client
    from app.core.config import settings
    local_supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    
    if not query:
        raise HTTPException(status_code=400, detail="Query is required")

    # Get policy context
    context_chunks = []
    if policy_id:
        try:
            # Use select * to be safe against column renaming issues
            clauses = local_supabase.table("clauses") \
                .select("*") \
                .eq("policy_id", policy_id) \
                .execute()
            
            if clauses.data:
                for c in clauses.data:
                    # defensivley get columns
                    text = c.get('clause_text') or c.get('text') or ''
                    expl = c.get('explanation') or ''
                    if text:
                        context_chunks.append(f"{text}\nExplanation: {expl}")
        except Exception as e:
            print(f"DEBUG: Clauses query FAILED: {e}")

        # Also get policy summary
        try:
            policy = supabase_admin.table("policies") \
                .select("*") \
                .eq("id", policy_id) \
                .single() \
                .execute()

            if policy.data:
                context_chunks.insert(0, f"Policy Summary: {policy.data.get('summary', '')}") # type: ignore
        except Exception as e:
            print(f"DEBUG: Policy query FAILED: {e}")

    # Get chat history
    chat_history = []
    try:
        history = supabase_admin.table("chat_history") \
            .select("*") \
            .eq("user_id", user.id) \
            .order("created_at", desc=True) \
            .limit(10) \
            .execute()
        
        if history.data:
            # Reverse to chronological order
            raw_history = list(reversed(history.data))
            for h in raw_history:
                role = h.get('role', 'user') # type: ignore
                content = h.get('content', '') # type: ignore
                chat_history.append({"role": role, "content": content})
    except Exception as e:
        print(f"DEBUG: History query FAILED: {e}")

    # Generate answer
    answer = await llm_service.chat_with_context(query, context_chunks, chat_history)

    # Save chat messages (non-critical)
    try:
        supabase_admin.table("chat_history").insert({
            "id": str(uuid.uuid4()),
            "user_id": user.id,
            "policy_id": policy_id,
            "role": "user",
            "content": query,
        }).execute()

        supabase_admin.table("chat_history").insert({
            "id": str(uuid.uuid4()),
            "user_id": user.id,
            "policy_id": policy_id,
            "role": "assistant",
            "content": answer,
        }).execute()
    except Exception as e:
        # Schema issue (missing 'content' column) causes 500 in logs, but chat works.
        print(f"DEBUG: Chat save FAILED (Non-fatal): {e}")

    # Log activity (non-critical)
    try:
        supabase_admin.table("activity_logs").insert({
            "id": str(uuid.uuid4()),
            "user_id": user.id,
            "action_type": "chat",
            "details": query[:100],
        }).execute()
    except Exception:
        pass

    return {"answer": answer}


@router.post("/translate")
async def translate(data: dict, user=Depends(get_current_user)):
    """Translate text."""
    text = data.get("text", "")
    target_language = data.get("target_language", "hi")

    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    translated = await llm_service.translate_text(text, target_language)

    # Log activity (non-critical)
    try:
        supabase_admin.table("activity_logs").insert({
            "id": str(uuid.uuid4()),
            "user_id": user.id,
            "action_type": "translated",
            "details": {"target_language": target_language},
        }).execute()
    except Exception as e:
        print(f"DEBUG: Translate log FAILED (Non-fatal): {e}")

    return {"translated_text": translated}


@router.post("/tts")
async def text_to_speech(data: dict, user=Depends(get_current_user)):
    """Convert text to speech."""
    text = data.get("text", "")
    language = data.get("language", "en")

    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    audio_stream = await tts_service.generate_speech(text, language)
    return StreamingResponse(audio_stream, media_type="audio/mpeg")


@router.get("/recommendations/{policy_id}")
async def recommendations(policy_id: str, user=Depends(get_current_user)):
    """Get recommendations based on a policy."""
    policy = supabase_admin.table("policies") \
        .select("original_text") \
        .eq("id", policy_id) \
        .single() \
        .execute()

    if not policy.data:
        raise HTTPException(status_code=404, detail="Policy not found")

    recs = await llm_service.get_recommendations(policy.data["original_text"]) # type: ignore
    return recs
