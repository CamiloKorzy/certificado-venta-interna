import psycopg2
from dotenv import load_dotenv
import os

load_dotenv('backend/.env')
conn=psycopg2.connect(
    host=os.environ.get('DB_HOST','ceesa.dw.finneg.com'),
    database=os.environ.get('DB_NAME','finnegansbi'),
    user=os.environ.get('DB_USER'),
    password=os.environ.get('DB_PASS')
)
cur=conn.cursor()
cur.execute("SELECT COUNT(*) FROM ceesa_cee_certificados_ventas_internas WHERE documento = 'CERTIFICADO_VENTA_INTERNO - 31' OR comprobante = 'CERTIFICADO_VENTA_INTERNO - 31'")
print("Total rows:", cur.fetchone()[0])
cur.execute("SELECT COUNT(*) FROM ceesa_cee_certificados_ventas_internas WHERE (documento = 'CERTIFICADO_VENTA_INTERNO - 31' OR comprobante = 'CERTIFICADO_VENTA_INTERNO - 31') AND TRIM(productonombre) != ''")
print("Item rows:", cur.fetchone()[0])
