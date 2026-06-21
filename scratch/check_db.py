import sys
import os

sys.path.append(r"c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend")
from main import get_supabase

conn = get_supabase()
cur = conn.cursor()
cur.execute("SELECT * FROM cert_ajustes_excel WHERE tipo_movimiento = 'INGRESO'")
rows = cur.fetchall()

print("Total Ajustes Ingreso:", len(rows))
for r in rows:
    print(r)
    
cur.close()
conn.close()
