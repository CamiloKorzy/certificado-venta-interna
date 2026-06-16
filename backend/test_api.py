import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def run():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS")
    )
    cur = conn.cursor()
    
    cur.execute("""
        SELECT transaccionid, COUNT(DISTINCT centrocosto) as c 
        FROM ceesa_cee_gastos_cc 
        GROUP BY transaccionid 
        HAVING COUNT(DISTINCT centrocosto) > 1 
        LIMIT 1;
    """)
    res = cur.fetchone()
    if res:
        tid = res[0]
        print(f"Found transaccionid {tid} with multiple DIFFERENT cost centers. Details:")
        cur.execute(f"SELECT transaccionid, numerodocumento, importeimputado, centrocosto FROM ceesa_cee_gastos_cc WHERE transaccionid = '{tid}'")
        for r in cur.fetchall():
            print(r)
    else:
        print("No transactions with multiple DIFFERENT cost center lines found in the view.")
        
    conn.close()

if __name__ == "__main__":
    run()
