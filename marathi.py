import urllib.request
import os

# URL for English → Marathi Argos model (from Argos Translate releases)
MODEL_URL = "https://github.com/argosopentech/argos-translate/releases/download/v1.9.0/translate-en_mr-1_0.argosmodel"
MODEL_DIR = "./assets/models"
MODEL_PATH = os.path.join(MODEL_DIR, "translate-en_mr-1_0.argosmodel")

# Create directory if not exists
os.makedirs(MODEL_DIR, exist_ok=True)

# Download the model if not already downloaded
if not os.path.exists(MODEL_PATH):
    print("📥 Downloading Marathi model...")
    urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    print(f"✅ Marathi model saved at {MODEL_PATH}")
else:
    print("✅ Marathi model already exists:", MODEL_PATH)
