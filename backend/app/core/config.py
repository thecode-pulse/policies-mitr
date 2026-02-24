# pyre-ignore-all-errors
"""
Application configuration - loads environment variables.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load backend/.env explicitly
BASE_DIR = Path(__file__).resolve().parent.parent.parent
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# Fallback: Manual load if dotenv failed (robustness fix for Windows BOM)
if not os.getenv("SUPABASE_URL") and env_path.exists():
    try:
        content = env_path.read_text(encoding="utf-8-sig")
        for line in content.splitlines():
            line = line.strip()
            if not line or line.startswith("#"): continue
            if "=" in line:
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip()
                if not os.getenv(key):
                    os.environ[key] = value
    except Exception:
        pass


class Settings:
    PROJECT_NAME: str = "PolicyMitr API"
    VERSION: str = "2.0.0"

    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")

    # AI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # CORS
    ALLOWED_ORIGINS: list = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(",")


settings = Settings()
