import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load env manually to handle BOM
import pathlib
env_path = pathlib.Path("backend/.env")
if env_path.exists():
    content = env_path.read_text(encoding="utf-8-sig")
    for line in content.splitlines():
        if "=" in line and not line.startswith("#"):
            key, value = line.split("=", 1)
            os.environ[key.strip()] = value.strip().strip("'").strip('"')

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print(f"Error: Missing keys. URL={url is not None}, KEY={key is not None}")
    exit(1)

print(f"Connecting to {url}...")
supabase: Client = create_client(url, key)

def test_profiles():
    print("Testing 'profiles' table select...")
    try:
        response = supabase.table("profiles").select("*").limit(1).execute()
        print("Success! Data:", response.data)
    except Exception as e:
        print("Error accessing profiles table:", e)

if __name__ == "__main__":
    test_profiles()
