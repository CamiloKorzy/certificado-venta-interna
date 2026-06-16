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
        WITH distinct_rows AS (
            SELECT DISTINCT 
                transaccionid, descripcionliquidacion, codigoconcepto, legajo, apellidonombre, 
                centrocosto, tipoconcepto, nombreconcepto, 
                CAST(REPLACE(importe, ',', '.') AS NUMERIC) as importe
            FROM ceesa_cee_liquidaciones_de_sueldos_
            WHERE legajo = '129' AND periodo = '202605'
        )
        SELECT descripcionliquidacion, tipoconcepto, SUM(importe)
        FROM distinct_rows
        GROUP BY descripcionliquidacion, tipoconcepto
        ORDER BY descripcionliquidacion, tipoconcepto
    """)
    rows = cur.fetchall()
    for r in rows:
        print(r)
    conn.close()

if __name__ == "__main__":
    run()
