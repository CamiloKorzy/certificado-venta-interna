import psycopg2
import os

DB_HOST = "ceesa.dw.finneg.com"
DB_PORT = "5432"
DB_NAME = "finnegansbi"
DB_USER = "ceesauser"
DB_PASS = "Lula$$2014"

def main():
    conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASS, sslmode="require")
    cur = conn.cursor()
    
    # Tables matching 'rh%' or '%asiento%' or '%sueldo%'
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND (table_name ILIKE '%rh_%' OR table_name ILIKE '%asiento%' OR table_name ILIKE '%legajo%' OR table_name ILIKE '%liquida%')
        ORDER BY table_name;
    """)
    print("Tables:")
    for r in cur.fetchall():
        print(r[0])
        
if __name__ == "__main__":
    main()
