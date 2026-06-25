import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend/.env')))

from main import get_supabase

def check_obras():
    conn = get_supabase()
    cur = conn.cursor()
    
    print("=== Obras Maestro ===")
    cur.execute("SELECT id, unidad_negocio, periodo, numero_interno, estado, obra FROM cert_obras_maestro")
    maestros = cur.fetchall()
    print(f"Total maestros: {len(maestros)}")
    for m in maestros:
        cur.execute("SELECT COUNT(*) FROM cert_obras_detalles WHERE maestro_id = %s", (m[0],))
        details_count = cur.fetchone()[0]
        print(f"ID: {m[0]}, Unidad: {m[1]}, Periodo: {m[2]}, Num: {m[3]}, Estado: {m[4]}, Obra: {m[5]}, Details Count: {details_count}")
        
    print("\n=== Respaldos ===")
    cur.execute("SELECT id, tipo_documento, unidad_negocio, periodo, nombre_archivo, OCTET_LENGTH(contenido) FROM cert_respaldos")
    respaldos = cur.fetchall()
    print(f"Total respaldos: {len(respaldos)}")
    for r in respaldos:
        print(f"ID: {r[0]}, Tipo: {r[1]}, Unidad: {r[2]}, Periodo: {r[3]}, Archivo: {r[4]}, Size: {r[5]} bytes")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    check_obras()
