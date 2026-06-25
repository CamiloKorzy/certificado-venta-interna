import sys
import os

sys.path.append(r"c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend")
from main import get_aurora

conn = get_aurora()
cur = conn.cursor()

cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND (table_name LIKE '%consum%' OR table_name LIKE '%insum%' OR table_name LIKE '%produc%' OR table_name LIKE '%stock%' OR table_name LIKE '%mov%')
    ORDER BY table_name
""")
rows = cur.fetchall()
print("--- SEARCH TABLES ---")
for r in rows:
    print(r[0])

cur.close()
conn.close()
