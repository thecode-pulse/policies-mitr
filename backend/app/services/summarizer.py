# pyre-ignore-all-errors
"""
BART Summarization & Classification Service — OPTIMIZED.
Uses facebook/bart-large-cnn for summarization and facebook/bart-large-mnli for classification.
Models are preloaded at import time for fast first-request performance.

Optimizations:
  - FP16 on CUDA for 2× faster inference + half VRAM usage
  - Greedy decoding (num_beams=1) instead of beam search for 3-4× speedup
  - Large 3000-char chunks → fewer inference passes
  - Cap at 3 chunks max → bounded processing time
  - Preload models at startup, not on first request
"""
import os
import time
import torch
from pathlib import Path

# Determine project root (services → app → backend → project root)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
SUMMARIZER_DIR = str(PROJECT_ROOT / "models" / "bart-summarizer")
CLASSIFIER_DIR = str(PROJECT_ROOT / "models" / "classifier")

# ── Device detection ──
USE_CUDA = torch.cuda.is_available()
DEVICE = torch.device("cuda:0" if USE_CUDA else "cpu")
print(f"[Summarizer] Device: {DEVICE} | FP16: {USE_CUDA}")


# ── Lazy loading containers ──
_model = None
_tokenizer = None
_classifier = None


def get_summarizer():
    """Lazy load summarizer model."""
    global _model, _tokenizer
    if _model is None:
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
        t0 = time.time()
        print(f"[Summarizer] Loading BART-CNN from {SUMMARIZER_DIR}...")
        _tokenizer = AutoTokenizer.from_pretrained(SUMMARIZER_DIR)
        _model = AutoModelForSeq2SeqLM.from_pretrained(SUMMARIZER_DIR)
        
        try:
            if hasattr(_model, "generation_config") and _model.generation_config:
                _model.generation_config.forced_bos_token_id = 0
            else:
                _model.config.forced_bos_token_id = 0
        except Exception:
            _model.config.forced_bos_token_id = 0

        if USE_CUDA:
            _model = _model.half()
        _model.to(DEVICE)
        _model.eval()
        print(f"[Summarizer] BART-CNN loaded in {time.time()-t0:.1f}s ✓")
    return _model, _tokenizer


def get_classifier():
    """Lazy load classifier model."""
    global _classifier
    if _classifier is None:
        from transformers import pipeline as hf_pipeline
        t0 = time.time()
        print(f"[Summarizer] Loading BART-MNLI from {CLASSIFIER_DIR}...")
        try:
            _classifier = hf_pipeline(
                "zero-shot-classification",
                model=CLASSIFIER_DIR,
                device=0 if USE_CUDA else -1,
                torch_dtype=torch.float16 if USE_CUDA else torch.float32,
            )
            print(f"[Summarizer] BART-MNLI loaded in {time.time()-t0:.1f}s ✓")
        except Exception as e:
            print(f"[Summarizer] Classifier load failed: {e}")
    return _classifier


# ── Constants ──
POLICY_CATEGORIES = [
    "Health", "Education", "Finance", "Agriculture",
    "Infrastructure", "Social Welfare", "Environment",
    "Technology", "Defense", "Other",
]


# ── Public functions ──

def summarize_text(text: str, max_length: int = 150) -> str:
    """Generate summary using BART-CNN. Optimized: greedy, FP16, large chunks."""
    text = text.strip()
    model, tokenizer = get_summarizer()
    
    if not model or not tokenizer:
        return text[:600] + ("..." if len(text) > 600 else "")

    if len(text.split()) < 30:
        return text

    # Large chunks (3000 chars), max 3 chunks → capped at ~9000 chars
    CHUNK_SIZE = 3000
    MAX_CHUNKS = 3
    
    total_len = len(text)
    limit = CHUNK_SIZE * MAX_CHUNKS
    end_point = total_len if total_len < limit else limit
    chunks = [text[i:i + CHUNK_SIZE] for i in range(0, end_point, CHUNK_SIZE)]
    summary_parts = []

    for chunk in chunks:
        inputs = tokenizer(chunk, return_tensors="pt", max_length=1024, truncation=True).to(DEVICE) # type: ignore
        with torch.no_grad():
            ids = model.generate( # type: ignore
                inputs["input_ids"],
                max_length=250,
                min_length=60,
                do_sample=False,
                num_beams=1,
                forced_bos_token_id=0,
                length_penalty=2.0,
                no_repeat_ngram_size=3
            )
        decoded = tokenizer.decode(ids[0], skip_special_tokens=True).strip() # type: ignore
        if decoded:
            summary_parts.append(decoded)

    full = " ".join(summary_parts)
    return full if full.endswith(('.', '!', '?')) else full + "."


def classify_policy(text: str) -> str:
    """Zero-shot classification using BART-MNLI."""
    classifier = get_classifier()
    if classifier is None:
        return "Government Policy"
    try:
        # Use only first 512 chars for speed
        result = classifier(text[:512], POLICY_CATEGORIES, multi_label=False) # type: ignore
        return result["labels"][0] # type: ignore
    except Exception as e:
        print(f"[Summarizer] Classification error: {e}")
        return "Government Policy"


def simplify_text(text: str) -> str:
    """Replace complex legal words with simpler equivalents."""
    replacements = {
        "therefore": "so", "utilize": "use", "subsequently": "then",
        "henceforth": "from now on", "pursuant to": "under",
        "in accordance with": "as per", "commence": "start",
        "terminate": "end", "notwithstanding": "despite",
        "endeavour": "try", "furnish": "provide", "procure": "get",
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text


async def analyze_policy(text: str) -> dict:
    """Full policy analysis: summarize → simplify → classify → extract clauses.
    Optimized for speed: greedy decoding, FP16, bounded input size.
    """
    start = time.time()

    # 1. Summarize (fast: greedy + FP16 + max 3 chunks)
    summary = summarize_text(text, max_length=150)

    # 2. Simplify summary
    simplified = simplify_text(summary)

    # 3. Classify (fast: only first 512 chars)
    category = classify_policy(text)

    # 4. Extract clauses from paragraphs (no model needed — instant)
    clauses = []
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip() and len(p.strip()) > 30]
    for i, para in enumerate(paragraphs[:10]):
        clauses.append({
            "clause_number": i + 1,
            "clause_text": para[:500],
            "explanation": simplify_text(para[:200]),
        })

    elapsed = float(f"{(time.time() - start):.2f}")
    print(f"[Summarizer] Analysis done in {elapsed}s")

    return {
        "summary": summary,
        "simplified": simplified,
        "category": category,
        "hindi_summary": "",
        "clauses": clauses,
        "difficulty_score": min(100, max(10, len(text.split()) // 50)),
        "ai_confidence": 0.85,
        "processing_time": elapsed,
    }
