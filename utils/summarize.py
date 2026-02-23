from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
from utils.gpu_config import get_device

def load_summarizer(model_dir="./models/bart-summarizer"):
    """Load summarizer with GPU support when available."""
    tokenizer = AutoTokenizer.from_pretrained(model_dir)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_dir, low_cpu_mem_usage=False)
    # Ensure generation config includes forced_bos_token_id=0 to silence the warning
    # and to ensure the model starts generation with the desired BOS token.
    try:
        if hasattr(model, "generation_config") and model.generation_config is not None:
            model.generation_config.forced_bos_token_id = 0
        else:
            model.config.forced_bos_token_id = 0
    except Exception:
        # Fallback to model.config if any attribute access fails
        model.config.forced_bos_token_id = 0
    device = get_device()
    model.to(device)
    return {"model": model, "tokenizer": tokenizer, "device": device}


def summarize_text(summarizer, text, max_words=150):
    """Generates a concise summary of the text with GPU acceleration."""
    text = text.strip()
    if len(text.split()) < 30:
        return text  # Skip summarization for very short text

    model = summarizer["model"]
    tokenizer = summarizer["tokenizer"]
    # Backward compatible: detect device if not in cache
    device = summarizer.get("device", get_device())
    
    max_chunk = 1000
    chunks = [text[i:i+max_chunk] for i in range(0, len(text), max_chunk)]
    summary_chunks = []
    
    for chunk in chunks:
        inputs = tokenizer(chunk, return_tensors="pt", max_length=1024, truncation=True).to(device)
        with torch.no_grad():  # Disable gradients for inference speed
            summary_ids = model.generate(
                inputs["input_ids"],
                max_length=max_words,
                min_length=40,
                do_sample=False,
                num_beams=4,
                forced_bos_token_id=getattr(model.config, "forced_bos_token_id", 0),
            )
        summary_text = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        summary_chunks.append(summary_text.strip())

    full_summary = " ".join(summary_chunks)
    return full_summary if full_summary.endswith(('.', '!', '?')) else full_summary + "."

def simplify_text(summary):
    """Simplifies the summary by replacing complex words."""
    replacements = {
        "therefore": "so",
        "utilize": "use",
        "subsequently": "then",
        "henceforth": "from now on"
    }
    for k, v in replacements.items():
        summary = summary.replace(k, v)
    return summary
