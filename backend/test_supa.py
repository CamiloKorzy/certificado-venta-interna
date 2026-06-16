import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def run():
    try:
        conn = psycopg2.connect(os.getenv("SUPABASE_DB_URL"))
        cur = conn.cursor()
        cur.execute("SELECT 1")
        print("Supabase is UP!")
        conn.close()
    except Exception as e:
        print("Supabase is DOWN:", e)

if __name__ == "__main__":
    run()
