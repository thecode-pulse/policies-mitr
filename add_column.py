import os
from supabase import create_client, Client

from dotenv import load_dotenv

load_dotenv("backend/.env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Error: Supabase credentials not found.")
    exit(1)

supabase: Client = create_client(url, key)

# SQL to add the column
sql = """
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policies' AND column_name = 'is_bookmarked') THEN
        ALTER TABLE policies ADD COLUMN is_bookmarked BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
"""

print("Adding 'is_bookmarked' column to 'policies' table...")
try:
    # Try to execute raw SQL via a generic query or rpc if available.
    # Supabase-py doesn't support raw SQL directly easily without RPC.
    # But we can try using the `postgrest` client to call a function if one exists, 
    # OR we can just use the requests library to hit the SQL interface if enabled? No.
    # Actually, simpler approach: The user likely doesn't have a way to run SQL easily.
    # I will try to use the `pg` library or `psycopg2` if available? No.
    # I will try to use a specialized RPC function if 'exec_sql' exists (common pattern).
    # If not, I will fail and ask the user to run it in their dashboard.
    
    # Let's try to just use valid Supabase client methods. 
    # Actually, often `rpc` is used. 
    # But wait, I can just use the Table interface to maybe update a row and forcedly cast? No.
    
    pass
except Exception as eobj:
    print(f"Failed: {eobj}")

# Since I cannot easily run DDL (Data Definition Language) from here without a direct DB connection string (which I might not have, I only have HTTP API keys),
# I will check if I have a postgres connection string in .env?
# Looking at previous logs, I only saw SUPABASE_URL and KEYS.
# However, I can try to use the CLI tool logic? 
# OR, I can just rely on the fact that `is_bookmarked` is missing and I should probably just implement a separate `bookmarks` table logic in the code IF I can create it.
# Actually, the error `column does not exist` is unrelated to my code's logic, it's a schema mismatch.
# I will try to FIX THE CODE to NOT rely on `is_bookmarked` column if it doesn't exist, 
# AND instead use a separate `bookmarks` table if that exists? 
# But the code explicitly calls `.select("is_bookmarked")`.
# The BEST fix is to ADD the column.
# I will create a script that uses `psycopg2` IF the connection string is available.
# Let me check `backend/.env` content first.
print("Checking for simplified solution...")
