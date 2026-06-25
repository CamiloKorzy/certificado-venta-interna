import sys
import os
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
load_dotenv(dotenv_path=os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend/.env')))

from main import get_certificaciones_maquinas_new, get_equipos_live

def run():
    print("=== Testing get_certificaciones_maquinas_new ===")
    res = get_certificaciones_maquinas_new("Seguridad de Activos", "05-2026")
    print(f"Returned {len(res)} items:")
    for r in res:
        print(r)
        
    print("\n=== Testing get_equipos_live ===")
    res_live = get_equipos_live("Seguridad de Activos", "05-2026")
    print(f"Returned {len(res_live)} items:")
    for r in res_live:
        if r.get("origen") == "SUPABASE_CERT" or "MD0001" in r.get("equipo", ""):
            print(f"Equipo: {r.get('equipo')} | Origen: {r.get('origen')} | Horas: {r.get('horas_kilometros')} | Precio: {r.get('precio_unitario')} | Total: {r.get('total')}")

if __name__ == '__main__':
    run()
