from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer
# from transformers.models.auto import get_supported_model_types
from utils.gpu_config import get_device_id
import torch


def load_classifier():
    device_id = get_device_id()
    
    # Use 8-bit quantization to reduce memory usage (~4x reduction)
    # This allows loading large models that would otherwise exceed available RAM
    try:
        # Load model with 8-bit quantization for memory efficiency
        model = AutoModelForSequenceClassification.from_pretrained(
            "./models/classifier",
            load_in_8bit=True,
            device_map="auto",  # Automatically distribute across GPU/CPU as needed
        )
        tokenizer = AutoTokenizer.from_pretrained("./models/classifier")
        
        # Return a pipeline-compatible object
        return pipeline(
            "zero-shot-classification",
            model=model,
            tokenizer=tokenizer,
            device=device_id
        )
    except Exception as e:
        # Fallback: load without 8-bit (might fail if RAM is too low)
        print(f"8-bit loading failed ({e}), attempting standard loading...")
        return pipeline(
            "zero-shot-classification",
            model="./models/classifier",
            device=device_id
        )
