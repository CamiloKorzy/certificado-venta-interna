import sys
import os
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
load_dotenv(dotenv_path=os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend/.env')))

from main import get_supabase

def run():
    print("Connecting to Supabase using .env...")
    conn = get_supabase()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)
    rows = cur.fetchall()
    print("--- TABLES IN .env SUPABASE ---")
    for r in rows:
        print(r[0])
        
    cur.close()
    conn.close()

if __name__ == '__main__':
    run()
