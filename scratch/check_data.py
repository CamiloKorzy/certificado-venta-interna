import os
from dotenv import load_dotenv
load_dotenv('backend/.env')
import psycopg2

conn = psycopg2.connect(os.environ['SUPABASE_DB_URL'])
cur = conn.cursor()
cur.execute("SELECT * FROM cert_config_centros_costo")
rows = cur.fetchall()
for row in rows:
    print(row)
conn.close()
