import sys
import os

sys.path.append(r"c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend")
from main import get_aurora

conn = get_aurora()
cur = conn.cursor()

cur.execute("SELECT COUNT(*) FROM ceesa_cee_certificados_ventas_internas WHERE empresa LIKE '%Taller%' OR cliente LIKE '%Taller%' OR equiposolicitantenombre LIKE '%Taller%'")
print("Total rows containing 'Taller':", cur.fetchone()[0])

cur.execute("SELECT DISTINCT empresa, cliente, equiposolicitantenombre FROM ceesa_cee_certificados_ventas_internas WHERE empresa LIKE '%Taller%' OR cliente LIKE '%Taller%' OR equiposolicitantenombre LIKE '%Taller%'")
for r in cur.fetchall():
    print(r)

cur.close()
conn.close()
