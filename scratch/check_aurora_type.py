import sys
sys.path.append(r"c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend")
from main import get_aurora

conn = get_aurora()
cur = conn.cursor()
cur.execute("SELECT fecha FROM ceesa_cee_certificados_ventas_internas LIMIT 1")
row = cur.fetchone()
print("Type of fecha:", type(row[0]), "Value:", repr(row[0]))
