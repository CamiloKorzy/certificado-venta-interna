import sys
sys.path.append(r"c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend")
from main import get_supabase

conn = get_supabase()
cur = conn.cursor()

# Check table exists and has data
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_name = 'cert_informes_proyecto'")
print("Table exists:", cur.fetchone())

cur.execute("SELECT * FROM cert_informes_proyecto")
rows = cur.fetchall()
cols = [desc[0] for desc in cur.description]
print("Columns:", cols)
for r in rows:
    print("Row:", dict(zip(cols, r)))

# Also check user unidades
cur.execute("SELECT * FROM cert_usuarios_unidades")
un_rows = cur.fetchall()
un_cols = [desc[0] for desc in cur.description]
print("\nUsuarios-Unidades:")
for r in un_rows:
    print("  ", dict(zip(un_cols, r)))

cur.close()
conn.close()
