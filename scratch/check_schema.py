import os
from dotenv import load_dotenv
load_dotenv('backend/.env')
import psycopg2

conn = psycopg2.connect(os.environ['SUPABASE_DB_URL'])
cur = conn.cursor()

def get_schema(table):
    cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'")
    print(f"--- Schema for {table} ---")
    for row in cur.fetchall():
        print(row)

get_schema('cert_cierres_mensuales')
get_schema('cert_cierres_detalle')

conn.close()
