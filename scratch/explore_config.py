import sys
import os

sys.path.append(r"c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend")
from main import get_supabase

conn = get_supabase()
cur = conn.cursor()

print("--- DISTINCT CATEGORIAS IN cert_config_gastos_cuentas ---")
cur.execute("SELECT DISTINCT categoria FROM cert_config_gastos_cuentas")
for r in cur.fetchall():
    print(r)

print("\n--- DISTINCT CATEGORIAS IN cert_ajustes_excel ---")
cur.execute("SELECT DISTINCT categoria FROM cert_ajustes_excel")
for r in cur.fetchall():
    print(r)

print("\n--- DISTINCT CATEGORIAS IN cert_cierres_detalle ---")
cur.execute("SELECT DISTINCT categoria FROM cert_cierres_detalle")
for r in cur.fetchall():
    print(r)

cur.close()
conn.close()
