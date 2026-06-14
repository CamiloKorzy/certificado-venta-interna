import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('.env')

conn = psycopg2.connect(
    host=os.getenv('DB_HOST'),
    port=os.getenv('DB_PORT'),
    dbname=os.getenv('DB_NAME'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASS')
)
cur = conn.cursor()

query = """
SELECT td.transaccionid, c.centrocostoid, c.nombre, td.importemonprincipal
FROM ceesa_bstransacciondimension td
JOIN ceesa_bscentrocosto c ON td.registroid = c.centrocostoid
WHERE td.dimensionid = '999999'
LIMIT 10
"""
cur.execute(query)
for row in cur.fetchall():
    print(row)
