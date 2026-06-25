import sys
import os

# Add backend directory to sys.path so we can import main
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

# Load dotenv to get env variables for Supabase and Aurora
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend/.env')))

from main import normalize_periodo, get_certificaciones_maquinas_new, get_informe_mensual_calculo_vivo, get_supabase

def test_normalize():
    print("=== Testing normalize_periodo ===")
    assert normalize_periodo("2026-05") == "2026-05", f"Got: {normalize_periodo('2026-05')}"
    assert normalize_periodo("05-2026") == "2026-05", f"Got: {normalize_periodo('05-2026')}"
    assert normalize_periodo("05/2026") == "2026-05", f"Got: {normalize_periodo('05/2026')}"
    assert normalize_periodo("2026/05") == "2026-05", f"Got: {normalize_periodo('2026/05')}"
    print("normalize_periodo PASSED")

def test_certificaciones_maquinas_no_crash():
    print("=== Testing get_certificaciones_maquinas_new ===")
    # Security of Assets (Seguridad de Activos)
    try:
        res_mm_yyyy = get_certificaciones_maquinas_new("Seguridad de Activos", "05-2026")
        print(f"MM-YYYY call didn't crash. Retrieved {len(res_mm_yyyy)} items.")
        res_yyyy_mm = get_certificaciones_maquinas_new("Seguridad de Activos", "2026-05")
        print(f"YYYY-MM call didn't crash. Retrieved {len(res_yyyy_mm)} items.")
        assert len(res_mm_yyyy) == len(res_yyyy_mm), "Both formats should return the same number of items"
        print("get_certificaciones_maquinas_new test PASSED")
    except Exception as e:
        print("get_certificaciones_maquinas_new failed with:", e)
        import traceback
        traceback.print_exc()
        sys.exit(1)

def test_obras_consolidation():
    print("=== Testing Obras consolidation ===")
    try:
        report = get_informe_mensual_calculo_vivo("Seguridad de Activos", "05-2026")
        ingresos = report.get("ingresos", [])
        obras_items = [item for item in ingresos if item.get("origen") == "OBRAS"]
        print(f"Found {len(obras_items)} consolidated Obras items in Ingresos.")
        for item in obras_items:
            print(f"  - Concepto: {item.get('concepto')}, Comprobante: {item.get('comprobante')}, Importe: {item.get('importe')}")
        print("Obras consolidation test PASSED")
    except Exception as e:
        print("Obras consolidation failed with:", e)
        import traceback
        traceback.print_exc()
        sys.exit(1)

def test_obras_consolidation_with_insert():
    print("=== Testing Obras consolidation with insert ===")
    conn = get_supabase()
    cur = conn.cursor()
    try:
        # Insert a fake confirmed certificate
        cur.execute("""
            INSERT INTO cert_obras_maestro (unidad_negocio, periodo, numero_interno, comitente, contratista, obra, fecha_certificado, estado, usuario_carga)
            VALUES ('Seguridad de Activos', '2026-05', 99999, 'Test Comitente', 'Test Contratista', 'Test Obra Falsa', '2026-05-15', 'CONFIRMADO', 'tester')
            RETURNING id
        """)
        maestro_id = cur.fetchone()[0]
        
        # Insert details with some parcial_presente values
        cur.execute("""
            INSERT INTO cert_obras_detalles (maestro_id, item, descripcion, parcial_presente)
            VALUES (%s, '1.1', 'Fake item 1', 1500.50)
        """, (maestro_id,))
        
        cur.execute("""
            INSERT INTO cert_obras_detalles (maestro_id, item, descripcion, parcial_presente)
            VALUES (%s, '1.2', 'Fake item 2', 2500.25)
        """, (maestro_id,))
        
        conn.commit()
        
        # Fetch report
        report = get_informe_mensual_calculo_vivo("Seguridad de Activos", "05-2026")
        ingresos = report.get("ingresos", [])
        obras_items = [item for item in ingresos if item.get("origen") == "OBRAS"]
        
        assert len(obras_items) >= 1, "Should have at least 1 consolidated item"
        target_item = [item for item in obras_items if "99999" in item.get("comprobante")][0]
        expected_total = 1500.50 + 2500.25
        assert abs(target_item.get("importe") - expected_total) < 0.01, f"Expected {expected_total}, got {target_item.get('importe')}"
        print(f"Consolidation verified! Total consolidated: {target_item.get('importe')}")
        print("test_obras_consolidation_with_insert PASSED")
    finally:
        # Cleanup
        try:
            cur.execute("DELETE FROM cert_obras_detalles WHERE maestro_id = %s", (maestro_id,))
            cur.execute("DELETE FROM cert_obras_maestro WHERE id = %s", (maestro_id,))
            conn.commit()
        except Exception as cleanup_err:
            print("Cleanup failed:", cleanup_err)
        cur.close()
        conn.close()

if __name__ == "__main__":
    test_normalize()
    test_certificaciones_maquinas_no_crash()
    test_obras_consolidation()
    test_obras_consolidation_with_insert()
    print("All tests completed successfully!")
