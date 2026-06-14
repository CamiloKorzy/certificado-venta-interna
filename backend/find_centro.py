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

query = "SELECT table_name, column_name FROM information_schema.columns WHERE column_name LIKE '%centrocosto%'"
cur.execute(query)
for row in cur.fetchall():
    print(row)
