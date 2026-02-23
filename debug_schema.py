import os
import pathlib
from supabase import create_client, Client

# Load env manually to handle BOM
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
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
    exit(1)

print(f"Connecting to {url}...")
supabase: Client = create_client(url, key)

try:
    # Fetch a policy that has clauses
    print("Fetching a policy ID...")
    p = supabase.table("policies").select("id").limit(1).execute()
    if p.data:
        policy_id = p.data[0]["id"]
        print(f"Testing with Policy ID: {policy_id}")
        
        
        # Now fetch chat_history
        print(f"Fetching chat_history for user...")
        response = supabase.table("chat_history").select("role, content").limit(1).execute()
        print("Chat history fetch success!")
    if response.data:
        print("Success! Row data keys:")
        for key in response.data[0].keys():
            print(f"- '{key}'")
    else:
        print("Table is empty, but query succeeded.")
except Exception as e:
    print("Error accessing clauses table:", e)
