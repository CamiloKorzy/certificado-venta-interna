import psycopg2
from dotenv import load_dotenv
import os

load_dotenv('backend/.env')
conn=psycopg2.connect(
    host=os.environ.get('AURORA_HOST'),
    database=os.environ.get('AURORA_DB'),
    user=os.environ.get('AURORA_USER'),
    password=os.environ.get('AURORA_PASS'),
    port=int(os.environ.get('AURORA_PORT', 5432)),
    connect_timeout=10
)
cur=conn.cursor()

try:
    cur.execute("SELECT SUM(CAST(total AS DECIMAL)) FROM ceesa_cee_certificados_ventas_internas WHERE empresa='Seguridad de Activos' AND EXTRACT(YEAR FROM CAST(fecha AS TIMESTAMP))=2026 AND EXTRACT(MONTH FROM CAST(fecha AS TIMESTAMP))=5")
    print("Total for empresa='Seguridad de Activos':", cur.fetchone()[0])
except Exception as e:
    print(e)
    conn.rollback()

try:
    cur.execute("SELECT SUM(CAST(total AS DECIMAL)) FROM ceesa_cee_certificados_ventas_internas WHERE cliente='Seguridad de Activos' AND EXTRACT(YEAR FROM CAST(fecha AS TIMESTAMP))=2026 AND EXTRACT(MONTH FROM CAST(fecha AS TIMESTAMP))=5")
    print("Total for cliente='Seguridad de Activos':", cur.fetchone()[0])
except Exception as e:
    print(e)

cur.close()
conn.close()
