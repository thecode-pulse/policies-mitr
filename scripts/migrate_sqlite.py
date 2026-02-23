"""
SQLite to Supabase Migration Script.
Reads existing data from policymitr.db and policy_app.db
and prepares it for insertion into Supabase.
"""
import sqlite3
import json
from datetime import datetime

# --- Configs ---
SQLITE_USER_DB = "../policymitr.db"
SQLITE_POLICY_DB = "../policy_app.db"


def read_sqlite_users():
    """Read users from local SQLite database."""
    try:
        conn = sqlite3.connect(SQLITE_USER_DB)
        cursor = conn.execute("SELECT id, username, email, password FROM users")
        users = [
            {"id": row[0], "username": row[1], "email": row[2], "password_hash": row[3]}
            for row in cursor.fetchall()
        ]
        conn.close()
        print(f"Found {len(users)} users in SQLite.")
        return users
    except Exception as e:
        print(f"Error reading users: {e}")
        return []


def read_sqlite_policies():
    """Read policies from local SQLite database."""
    try:
        conn = sqlite3.connect(SQLITE_POLICY_DB)
        cursor = conn.execute(
            "SELECT id, category, summary, simplified, policy_name, timestamp FROM policies"
        )
        policies = [
            {
                "id": row[0],
                "category": row[1],
                "summary": row[2],
                "simplified": row[3],
                "title": row[4],
                "created_at": row[5],
            }
            for row in cursor.fetchall()
        ]
        conn.close()
        print(f"Found {len(policies)} policies in SQLite.")
        return policies
    except Exception as e:
        print(f"Error reading policies: {e}")
        return []


def export_to_json():
    """Export SQLite data to JSON files for manual Supabase import."""
    users = read_sqlite_users()
    policies = read_sqlite_policies()

    with open("migration_users.json", "w") as f:
        json.dump(users, f, indent=2)
    print("Exported users to migration_users.json")

    with open("migration_policies.json", "w") as f:
        json.dump(policies, f, indent=2)
    print("Exported policies to migration_policies.json")

    print("\n--- Migration Summary ---")
    print(f"Users: {len(users)}")
    print(f"Policies: {len(policies)}")
    print("\nTo complete migration:")
    print("1. Create users in Supabase Auth (signup via API or dashboard)")
    print("2. Import policies JSON into Supabase 'policies' table")
    print("3. Map user IDs from old system to new Supabase UUIDs")


if __name__ == "__main__":
    export_to_json()
