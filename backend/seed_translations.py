import os
import uuid
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv('.env')

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not found in .env")
    exit(1)

supabase = create_client(url, key)

# Real User ID and Policy ID to satisfy foreign key constraints
user_id = 'f34af9df-173a-4879-a976-bc03c7b63d74'
policy_id = '0de8a57b-a62e-47ec-941d-938211aad6f3'

translations = [
    {'lang': 'en', 'count': 21},
    {'lang': 'hi', 'count': 10},
    {'lang': 'mr', 'count': 4},
    {'lang': 'ta', 'count': 2}
]

data_to_insert = []
for item in translations:
    for _ in range(item['count']):
        data_to_insert.append({
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'policy_id': policy_id,
            'action_type': 'translated',
            'details': {'target_language': item['lang']}
        })

try:
    # Supabase allows batch inserts
    response = supabase.table('activity_logs').insert(data_to_insert).execute()
    print(f"Successfully inserted {len(response.data)} translation records!")
except Exception as e:
    print(f"Error during insertion: {e}")
