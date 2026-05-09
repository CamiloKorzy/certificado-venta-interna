import os
import sys
from dotenv import load_dotenv
import psycopg2

load_dotenv('.env.local')

def main():
    try:
        conn = psycopg2.connect(
            host=os.getenv("AURORA_DB_HOST"),
            database=os.getenv("AURORA_DB_NAME"),
            user=os.getenv("AURORA_DB_USER"),
            password=os.getenv("AURORA_DB_PASSWORD"),
            port=os.getenv("AURORA_DB_PORT", "5432")
        )
        cur = conn.cursor()
        cur.execute("""
            SELECT *
            FROM ceesa_cee_certificados_ventas_internos 
            WHERE numerodocumento IN ('CERTIFICADO_VENTA_INTERNO - 16', 'CERTIFICADO_VENTA_INTERNO - 22', 'CERTIFICADO_VENTA_INTERNO - 24', 'CERTIFICADO_VENTA_INTERNO - 26')
        """)
        cols = [desc[0] for desc in cur.description]
        print(cols)
        for row in cur.fetchall():
            print(dict(zip(cols, row)))
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
