import os
import pathlib
import sys

# Setup env for imports
sys.path.append(os.path.join(os.getcwd(), "backend"))

# Load env manually
from dotenv import load_dotenv
load_dotenv("backend/.env")

from fastapi.testclient import TestClient
from backend.app import main
app = main.app
from backend.app.core.security import get_current_user
from backend.app.routers import ai
print(f"DEBUG: main.py location: {main.__file__}")
print(f"DEBUG: ai.py location: {ai.__file__}")

# Mock User
class MockUser:
    id = "f34af9df-173a-4879-a976-bc03c7b63d74"
    email = "test@example.com"
    user_metadata = {"full_name": "Test User"}

# 1. Test implementation WITH auth override (to test ai.chat logic)
def test_with_override():
    print("\n=== Testing /api/ai/chat WITH Auth Override ===")
    app.dependency_overrides[get_current_user] = lambda: MockUser()
    client = TestClient(app)
    
    # Fetch a real policy ID
    from backend.app.core.security import supabase_admin
    policy_id = None
    try:
        p = supabase_admin.table("policies").select("id").limit(1).execute()
        if p.data:
            policy_id = p.data[0]["id"]
            print(f"Using Policy ID: {policy_id}")
    except:
        print("Could not fetch policy, sending None")

    try:
        response = client.post("/api/ai/chat", json={
            "query": "What is this policy?",
            "policy_id": policy_id
        })
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print("CRASHED:")
        import traceback
        traceback.print_exc()
    
    app.dependency_overrides = {} # Reset

# 2. Test implementation WITHOUT auth override (to test security.py)
# We need a token that "looks" valid or we expect 401. 
# If it returns 500 instead of 401, then security.py is crashing.
def test_auth_layer():
    print("\n=== Testing /api/ai/chat Auth Layer ===")
    client = TestClient(app)
    headers = {"Authorization": "Bearer invalid_token_test"}
    
    try:
        response = client.post("/api/ai/chat", json={"query": "hi"}, headers=headers)
        print(f"Status: {response.status_code}")
        # We expect 401. If 500, we found a bug.
        if response.status_code == 500:
            print("!!! CAUGHT 500 ERROR IN AUTH !!!")
            print(response.text)
        else:
            print(f"Response: {response.text}")
            
    except Exception as e:
        print("CRASHED in Auth:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_with_override()
    # test_auth_layer()
