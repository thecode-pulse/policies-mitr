# pyre-ignore-all-errors
"""
LLM Service - Uses Google Gemini for translation, chatbot, and comparisons.
Summarization is handled by the BART-based summarizer service.
"""
import json
import time
import google.generativeai as genai
from app.core.config import settings

# Configure Gemini
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")
    fallback_model = genai.GenerativeModel("gemini-2.5-flash-lite")
else:
    model = None
    fallback_model = None

def generate_content_with_fallback(prompt: str):
    """Attempt primary model, smoothly fallback to high-capacity 1.5-flash on quota constraints."""
    try:
        if not model:
            raise Exception("No model available")
        return model.generate_content(prompt)
    except Exception as e:
        err_str = str(e).lower()
        if ("429" in err_str or "quota" in err_str or "exhausted" in err_str) and fallback_model:
            print("[LLM] Primary Gemini 2.5 quota met. Seamlessly falling back to Gemini 1.5 Flash...")
            return fallback_model.generate_content(prompt)
        raise e



# Fallback translation engines
from deep_translator import GoogleTranslator
import argostranslate.package
import argostranslate.translate
from pathlib import Path
import os

# Initialize Argos Translate for Hindi (Offline)
ARGOS_MODEL = Path(__file__).resolve().parent.parent.parent.parent / "assets" / "models" / "translate-en_hi-1_1.argosmodel"
_argos_ready = False
_hindi_translator = None

def _init_argos():
    global _argos_ready, _hindi_translator
    if _argos_ready: return True
    try:
        if ARGOS_MODEL.exists():
            argostranslate.package.install_from_path(str(ARGOS_MODEL))
            installed = argostranslate.translate.get_installed_languages()
            en = next(l for l in installed if l.code == "en")
            hi = next(l for l in installed if l.code == "hi")
            _hindi_translator = en.get_translation(hi)
            _argos_ready = True
            print("[LLM] Argos Translate Hindi loaded ✓")
            return True
    except Exception as e:
        print(f"[LLM] Argos load failed: {e}")
    return False

# Initialize at import
_init_argos()

async def chat_with_context(query: str, context_chunks: list, chat_history: list = None) -> str:
    """RAG-based chat with policy context using Gemini."""
    if not model:
        # Fallback: Simple keyword search in context
        query_lower = query.lower()
        best_chunks = []
        
        if context_chunks:
            # Score chunks by keyword match
            pairs = [] # type: list[tuple[int, str]]
            words = [w for w in query_lower.split() if len(w) > 3]
            for chunk in context_chunks:
                score = sum(1 for w in words if w in chunk.lower())
                pairs.append((score, chunk))
            
            pairs.sort(key=lambda x: x[0], reverse=True)
            best_chunks = [p[1] for p in pairs if p[0] > 0][:2]

        if best_chunks:
            context_text = "\n\n".join(best_chunks)
            history_list = []
            for h in (chat_history or [])[-5:]:
                role = h.get('role', 'user') # type: ignore
                content = h.get('content', '') # type: ignore
                history_list.append(f"{role}: {content}")
            history_text = "\n".join(history_list)
            return f"*(AI Offline Mode)* I found this in the policy: \n\n{context_text}\n\n(Note: For better conversational replies, please add GEMINI_API_KEY)"
        return "*(AI Offline Mode)* I'm sorry, I couldn't find a direct answer in the policy. Without an API key, my reasoning is limited."

    context = "\n\n".join(context_chunks[:5]) if context_chunks else ""
    history_list = []
    for h in (chat_history or [])[-5:]:
        role = h.get('role', 'user') # type: ignore
        content = h.get('content', '') # type: ignore
        history_list.append(f"{role}: {content}")
    history_text = "\n".join(history_list)
    
    if context:
        prompt = f"""You are Mitr, an AI policy assistant. Answer accurately based ONLY on this context:
{context}

Recent History:
{history_text}

User: {query}
Assistant:"""
    else:
        prompt = f"""You are Mitr, an expert AI policy assistant for Indian citizens. 
You have extensive knowledge of government schemes, policies, laws, and administrative procedures.
Please answer the user's question accurately, comprehensively, and in a simple, easy-to-understand manner.

Recent History:
{history_text}

User: {query}
Assistant:"""

    try:
        response = generate_content_with_fallback(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Gemini Error: {str(e)}"


async def translate_text(text: str, target_language: str) -> str:
    """Translate text with high-quality Gemini effort and multiple fallbacks."""
    # 1. Gemini (Best Quality - High Fidelity)
    if model:
        try:
            prompt = (
                f"You are a professional government policy translator. "
                f"Translate the following text to {target_language} with absolute accuracy and professional clarity. "
                f"Maintain a formal tone and do not omit any details or paraphrase. "
                f"Return ONLY the translated text.\n\n"
                f"Text:\n{text[:3000]}"
            )
            response = generate_content_with_fallback(prompt)
            return response.text.strip()
        except Exception:
            pass

    # 2. Argos Translate (User's preferred "old code" for Hindi)
    if target_language == "hi" and _hindi_translator:
        try:
            return _hindi_translator.translate(text)
        except: pass

    # 3. Deep Translator (Free web-based fallback)
    try:
        return GoogleTranslator(source='auto', target=target_language).translate(text[:4500])
    except Exception as e:
        return f"Translation error: {e}"


async def compare_policies(text_a: str, text_b: str) -> dict:
    """Compare two policies using Gemini."""
    if not model:
        return {"comparison": "AI comparison requires GEMINI_API_KEY.", "similarities": [], "differences": []}

    prompt = f"""Compare these two government policies and return a JSON with:
- "comparison": Overall comparison summary (200 words)
- "similarities": Array of similarity points
- "differences": Array of difference points
- "recommendation": Which policy is better for citizens

Policy A:
{text_a[:3000]}

Policy B:
{text_b[:3000]}

RESPOND WITH ONLY VALID JSON."""

    try:
        response = generate_content_with_fallback(prompt)
        response_text = response.text.strip()
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])
        return json.loads(response_text)
    except Exception as e:
        return {"comparison": f"Error: {str(e)}", "similarities": [], "differences": []}


async def get_recommendations(policy_text: str) -> list:
    """Get policy recommendations using Gemini."""
    if not model:
        return ["Configure GEMINI_API_KEY for AI recommendations."]

    prompt = f"""Based on this policy, suggest 5 related government schemes or policies a citizen should know about.
Return a JSON array of strings.

Policy:
{policy_text[:2000]}

RESPOND WITH ONLY A JSON ARRAY OF STRINGS."""

    try:
        response = generate_content_with_fallback(prompt)
        response_text = response.text.strip()
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])
        return json.loads(response_text)
    except Exception:
        return ["No recommendations available."]


async def analyze_policy_gemini(text: str) -> dict:
    """Analyze policy using Gemini (much faster than local BART)."""
    start = time.time()
    
    if not model:
        # Fallback to the slow local summarizer if no API key
        from . import summarizer
        return await summarizer.analyze_policy(text)
        
    prompt = f"""You are an expert legal AI assistant. Analyze the following government policy and return a JSON object with EXACTLY these keys:
- "summary": A concise summary of the policy (around 100-150 words).
- "simplified": A very simple, plain-English explanation for a 10-year-old.
- "category": The best fitting category (e.g., Health, Education, Finance, Agriculture, Infrastructure, Social Welfare, Environment, Technology, Defense, or Other).
- "hindi_summary": A high-quality translation of the summary in Hindi.
- "clauses": An array of objects, where each object has:
    - "clause_number": Integer (1, 2, 3...)
    - "clause_text": The original or slightly compressed text of a key clause.
    - "explanation": Simple plain-English explanation of this clause.
- "difficulty_score": A number out of 100 estimating how hard it is to read (higher = harder).

Analyze this policy text:
{text[:15000]}

RESPOND WITH ONLY VALID JSON. Do not include markdown formatting or backticks around the json.
"""
    try:
        response = generate_content_with_fallback(prompt)
        response_text = response.text.strip()
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])
        if response_text.startswith("json"):
            response_text = response_text[4:].strip()
            
        data = json.loads(response_text)
        data["ai_confidence"] = 0.95
        data["processing_time"] = round(time.time() - start, 2)
        return data
    except Exception as e:
        print(f"[LLM] Gemini analysis failed: {e}. Falling back to local model.")
        from . import summarizer
        return await summarizer.analyze_policy(text)

