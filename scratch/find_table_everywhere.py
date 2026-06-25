import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend/.env')))

from main import get_supabase

def find_tables():
    conn = get_supabase()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_name LIKE '%certificacion%' OR table_name LIKE '%maquina%' OR table_name LIKE '%equipo%'
        ORDER BY table_schema, table_name
    """)
    rows = cur.fetchall()
    print("--- MATCHING TABLES ---")
    for r in rows:
        print(f"{r[0]}.{r[1]}")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    find_tables()
