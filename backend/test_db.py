import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
try:
    conn = psycopg2.connect(
        os.getenv('SUPABASE_DB_URL')
    )
    cur = conn.cursor()
    cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema='public'
    """)
    print([r[0] for r in cur.fetchall()])
except Exception as e:
    print(f"Error: {e}")
