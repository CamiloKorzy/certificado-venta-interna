import sys
sys.path.append(r"c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend")
from main import get_supabase

conn = get_supabase()
cur = conn.cursor()
cur.execute("SELECT id, unidad_negocio, periodo, estado, usuario_apertura FROM cert_informes_proyecto")
rows = cur.fetchall()
print("Informes:")
for r in rows:
    print(r)
