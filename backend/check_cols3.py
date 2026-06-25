import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from main import get_aurora
import psycopg2.extras

conn = get_aurora()
cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
cur.execute("SELECT * FROM ceesa_cee_tracking_de_ventas_v11 LIMIT 1")
row = cur.fetchone()
print(list(row.keys()))
