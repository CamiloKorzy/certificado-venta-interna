import sys
import os
import psycopg2
from datetime import datetime

# Add backend to path to import connection info or do it directly
DB_HOST = "infraestructura-aurora-datawarehouse-instance-zxhlvevffc1c.cijt7auhxunw.us-east-1.rds.amazonaws.com"
DB_PORT = "5432"
DB_NAME = "finnegansbi"
DB_USER = "ceesauser"
DB_PASS = "Lula$$2014"

def check():
    conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASS, sslmode="require")
    cur = conn.cursor()
    
    # 1. Check Date Format and range in DB
    cur.execute("SELECT fecha FROM ceesa_cee_certificados_ventas_internas WHERE fecha IS NOT NULL LIMIT 10")
    sample_dates = [x[0] for x in cur.fetchall()]
    print("Sample dates from DB:", sample_dates)
    
    # 2. Get min and max dates
    cur.execute("SELECT MIN(fecha), MAX(fecha) FROM ceesa_cee_certificados_ventas_internas")
    min_date, max_date = cur.fetchone()
    print(f"Min date in DB: {min_date}, Max date in DB: {max_date}")

    # 3. Query rows in the last week (2026-06-14 to 2026-06-21)
    # Since fecha is text, we can try converting it to timestamp/date, or we can use casting.
    # Let's try casting: CAST(fecha AS DATE) or just compare string if YYYY-MM-DD.
    print("Querying last week (2026-06-14 to 2026-06-21)...")
    cur.execute("""
        SELECT COUNT(*) 
        FROM ceesa_cee_certificados_ventas_internas
        WHERE CAST(fecha AS TIMESTAMP) >= '2026-06-14'
          AND CAST(fecha AS TIMESTAMP) <= '2026-06-21'
    """)
    count = cur.fetchone()[0]
    print(f"Total rows in last week: {count}")
    
    # Let's query some rows if they exist
    if count > 0:
        cur.execute("""
            SELECT fecha, documento, comprobante, cliente, empresa, productonombre, equiposolicitantenombre, itemcantidad, itemprecio, itemimporte, conceptonombre, descripcion
            FROM ceesa_cee_certificados_ventas_internas
            WHERE CAST(fecha AS TIMESTAMP) >= '2026-06-14'
              AND CAST(fecha AS TIMESTAMP) <= '2026-06-21'
            LIMIT 5
        """)
        rows = cur.fetchall()
        for r in rows:
            print(r)
            
    cur.close()
    conn.close()

if __name__ == '__main__':
    check()
