import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('.env')

DB_HOST = os.environ.get("DB_HOST", "ceesa.dw.finneg.com")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "finnegansbi")
DB_USER = os.environ.get("DB_USER", "ceesauser")
DB_PASS = os.environ.get("DB_PASS", "Lula$$2014")

try:
    conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASS, sslmode="require")
    cur = conn.cursor()
    
    # Check view definition in PostgreSQL
    cur.execute("SELECT view_definition FROM information_schema.views WHERE table_name = 'ceesa_cee_certificados_ventas_internas'")
    row = cur.fetchone()
    if row:
        print("View definition:", row[0])
    else:
        # Check if table exists
        cur.execute("SELECT table_type FROM information_schema.tables WHERE table_name = 'ceesa_cee_certificados_ventas_internas'")
        row_type = cur.fetchone()
        print("Table type:", row_type)
        
    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
