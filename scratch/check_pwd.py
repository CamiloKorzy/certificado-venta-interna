import sys
sys.path.append(r"c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend")
from main import get_supabase, verify_password

conn = get_supabase()
cur = conn.cursor()
cur.execute("SELECT id, email, password FROM cert_usuarios WHERE email = 'admin@ceeenriquez.com'")
row = cur.fetchone()
print("User:", row[0], row[1])
print("Hash:", row[2][:60] + "...")

# Try common passwords
for pwd in ["admin123", "Admin123", "admin", "cee2024", "cee2025", "cee2026"]:
    result = verify_password(pwd, row[2])
    print(f"  '{pwd}' => {result}")
