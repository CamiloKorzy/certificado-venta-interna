import sys
sys.path.append(r"c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend")
from main import get_supabase

conn = get_supabase()
cur = conn.cursor()
cur.execute("SELECT id, email, nombre, rol, activo FROM cert_usuarios")
rows = cur.fetchall()
for r in rows:
    print(r)
