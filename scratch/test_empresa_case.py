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
    cur.execute("SELECT DISTINCT empresa FROM ceesa_cee_certificados_ventas_internas WHERE empresa ILIKE '%Seguridad%'")
    print("Empresas:", cur.fetchall())
except Exception as e:
    print(e)

cur.close()
conn.close()
