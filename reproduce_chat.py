import requests
import json

url = "http://localhost:8000/api/ai/chat"
# Mock a user token if needed, but for now let's see if we can trigger it or if it fails on auth first. 
# actually the endpoint depends on get_current_user.
# I need a valid token. 
# Plan B: I will try to invoke the function directly in a python script rather than HTTP request to get a better traceback 
# because HTTP 500 from requests won't show the server traceback unless the server is in debug mode and returns it.

# Let's write a script that imports the app and runs the function logic directly.
# This requires mocking the DB or having the DB connection work.
# Given the DB connection works for other things, this should be fine.

import sys
import os
import asyncio
from dotenv import load_dotenv

# Add backend to sys path
sys.path.append(os.path.join(os.getcwd(), "backend"))

# Load env
load_dotenv("backend/.env")

# Mock dependencies
class MockUser:
    id = "f34af9df-173a-4879-a976-bc03c7b63d74" # Use the ID from the logs

async def test_chat():
    try:
        from app.routers import ai
        from app.core.security import supabase_admin
        
        # Mock data
        user = MockUser()
        data = {
            "query": "What are the key benefits?",
            "policy_id": "test-policy-id" # We need a valid policy ID or handle invalid one
        }

        print("Testing chat logic...")
        
        from app.core.config import settings
        print(f"DEBUG: URL={settings.SUPABASE_URL}")
        print(f"DEBUG: KEY_LEN={len(settings.SUPABASE_SERVICE_KEY) if settings.SUPABASE_SERVICE_KEY else 0}")
        
        # 1. Test Context Retrieval
        print("1. Fetching policy...")
        # Try to fetch ANY policy to get a valid ID if possible
        policies = supabase_admin.table("policies").select("id").limit(1).execute()
        if policies.data:
            data["policy_id"] = policies.data[0]["id"]
            print(f"Using policy ID: {data['policy_id']}")
        else:
            print("No policies found. Using dummy ID.")

        # Simulate the logic in ai.chat
        query = data.get("query", "")
        policy_id = data.get("policy_id")
        
        context_chunks = []
        if policy_id:
            print("   - Fetching clauses...")
            clauses = supabase_admin.table("clauses").select("*").eq("policy_id", policy_id).execute()
            print(f"   - Got {len(clauses.data)} clauses.")
            
            print("   - Fetching summary...")
            # THIS LOOKS SUSPICIOUS IN THE ORIGINAL CODE:
            # .single() might crash if no result is found?
            policy = supabase_admin.table("policies").select("summary, original_text").eq("id", policy_id).single().execute()
            print("   - Got policy summary.")

        print("2. Fetching history...")
        history = supabase_admin.table("chat_history").select("role, content").eq("user_id", user.id).limit(10).execute()
        print("   - Got history.")

        print("3. Calling LLM...")
        from app.services import llm
        
        # We need to make sure LLM is configured
        print(f"   - Gemini Key present? {'GEMINI_API_KEY' in os.environ}")
        
        answer = await llm.chat_with_context(query, context_chunks, [])
        print(f"Success! Answer: {answer[:50]}...")

    except Exception as e:
        print("\nCRASHED WITH ERROR:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    from app.core.config import settings
    print(f"DEBUG: URL={settings.SUPABASE_URL}")
    print(f"DEBUG: KEY_LEN={len(settings.SUPABASE_SERVICE_KEY) if settings.SUPABASE_SERVICE_KEY else 0}")
    asyncio.run(test_chat())
