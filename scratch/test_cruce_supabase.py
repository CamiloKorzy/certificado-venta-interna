import sys
import os
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
load_dotenv(dotenv_path=os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend/.env')))

from main import get_equipos_live

def test_integration():
    print("=== RUNNING SUPABASE INTEGRATION TEST ===")
    res = get_equipos_live("Seguridad de Activos", "05-2026")
    
    md0001_item = None
    for item in res:
        if "MD0001" in item.get("equipo", ""):
            md0001_item = item
            break
            
    if not md0001_item:
        print("ERROR: MD0001 item not found in response!")
        sys.exit(1)
        
    print("MD0001 Item details:")
    print(f"  Equipo: {md0001_item.get('equipo')}")
    print(f"  Origen: {md0001_item.get('origen')}")
    print(f"  Horas Registro: {md0001_item.get('horas_registro')}")
    print(f"  Horas a Cobrar: {md0001_item.get('horas_a_cobrar')}")
    print(f"  Disponibilidad: {md0001_item.get('disponibilidad')}%")
    print(f"  Utilizacion: {md0001_item.get('utilizacion')}%")
    print(f"  Fecha Certificacion: {md0001_item.get('fecha_certificacion')}")
    print(f"  Tarifa Neta: ${md0001_item.get('precio_unitario'):,.2f}")
    print(f"  Total: ${md0001_item.get('total'):,.2f}")
    
    # Assert values
    assert md0001_item.get('origen') == 'SUPABASE_CERT', "Expected origen to be SUPABASE_CERT"
    assert abs(md0001_item.get('horas_a_cobrar') - 173.0) < 0.01, "Expected 173.0 hours to be billed"
    assert abs(md0001_item.get('precio_unitario') - 25859.78) < 0.01, "Expected rate to be $25859.78"
    assert abs(md0001_item.get('total') - 4473741.94) < 0.05, "Expected total to be $4,473,741.94"
    
    print("\nSUCCESS: All integration checks passed!")

if __name__ == '__main__':
    test_integration()
