import sqlite3
from datetime import datetime

# -------------------- DATABASE CONNECTION -------------------- #
DB_NAME = "policy_app.db"

def _get_connection():
    """Get a fresh database connection."""
    return sqlite3.connect(DB_NAME, check_same_thread=False)

# -------------------- TABLE CREATION -------------------- #
def create_table():
    """
    Creates the 'policies' table if it does not exist.
    Columns: id, category, summary, simplified, policy_name, timestamp
    """
    conn = _get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS policies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            summary TEXT,
            simplified TEXT,
            policy_name TEXT,
            timestamp TEXT
        )
    """)
    conn.commit()
    conn.close()

# -------------------- INSERT POLICY -------------------- #
def insert_policy(category, summary, simplified, policy_name="Unnamed Policy"):
    """
    Inserts a single policy into the database with the current timestamp.
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = _get_connection()
    conn.execute("""
        INSERT INTO policies (category, summary, simplified, policy_name, timestamp)
        VALUES (?, ?, ?, ?, ?)
    """, (category, summary, simplified, policy_name, timestamp))
    conn.commit()
    conn.close()

# -------------------- FETCH ALL POLICIES -------------------- #
def fetch_all_policies():
    """
    Returns all policies in the database as a list of tuples:
    (id, category, summary, simplified, policy_name, timestamp)
    """
    conn = _get_connection()
    result = conn.execute("""
        SELECT id, category, summary, simplified, policy_name, timestamp
        FROM policies
        ORDER BY id DESC
    """).fetchall()
    conn.close()
    return result

# -------------------- DELETE POLICY -------------------- #
def delete_policy(policy_id):
    """
    Deletes a policy by its ID.
    """
    conn = _get_connection()
    conn.execute("DELETE FROM policies WHERE id=?", (policy_id,))
    conn.commit()
    conn.close()

# -------------------- BATCH INSERT (OPTIONAL) -------------------- #
def insert_multiple_policies(policies_list):
    """
    Insert multiple policies efficiently.
    policies_list: list of tuples (category, summary, simplified, policy_name)
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = _get_connection()
    conn.executemany("""
        INSERT INTO policies (category, summary, simplified, policy_name, timestamp)
        VALUES (?, ?, ?, ?, ?)
    """, [(cat, sumy, simp, name, timestamp) for cat, sumy, simp, name in policies_list])
    conn.commit()
    conn.close()
