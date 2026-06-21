import sys
import os

sys.path.append(r"c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend")
from main import get_aurora

conn = get_aurora()
cur = conn.cursor()

try:
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'ceesa_cee_certificados_ventas_internas'
        ORDER BY ordinal_position
    """)
    for r in cur.fetchall():
        print(f"{r[0]}: {r[1]}")
except Exception as e:
    print("Error:", e)

cur.close()
conn.close()
