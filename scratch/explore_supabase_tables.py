import sys
import os

sys.path.append(r"c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend")
from main import get_supabase

conn = get_supabase()
cur = conn.cursor()

cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
""")
rows = cur.fetchall()
print("--- SUPABASE TABLES ---")
for r in rows:
    print(r[0])

cur.close()
conn.close()
