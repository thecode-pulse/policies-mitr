import os
from supabase import create_client, Client

url = "https://ojfzqwnffviaoediffzv.supabase.co"
key = os.getenv("SUPABASE_SERVICE_KEY")

# Manually load env if needed
if not key:
    with open("backend/.env", "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("SUPABASE_SERVICE_KEY="):
                key = line.strip().split("=", 1)[1]
                break

print(f"Connecting to {url}...")
supabase: Client = create_client(url, key)

print("\n=== Testing Chat History Schema ===")

try:
    print("Attempting to select * from chat_history limit 1...")
    result = supabase.table("chat_history").select("*").limit(1).execute()
    if result.data:
        print("Row 1 keys:", result.data[0].keys())
    else:
        print("Table is empty but query succeeded. Columns unknown without data.")
        # Try inserting to probe columns
        print("Attempting dry-run insert to check 'content' column...")
        try:
             # We won't actually commit this if we error out, but let's try a safe insert that we can inspect exception from
             pass
        except:
            pass

except Exception as e:
    print(f"Select * failed: {e}")
