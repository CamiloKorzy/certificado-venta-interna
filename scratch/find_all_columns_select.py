import urllib.request
import urllib.error

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def test_column(col_name):
    # Test if a column exists by querying it in the select clause
    url = f"{SUPABASE_URL}/rest/v1/certificaciones_maquinas?select=id,{col_name}"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}",
        }
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        if "does not exist" in body:
            return False
        # If it's another error (like 400 syntax or whatever), it probably exists
        return True
    except Exception as e:
        return False

def scan():
    candidates = [
        # Time / Dates
        "mes", "anio", "fecha", "periodo", "mes_imputacion", "anio_imputacion", "created_at", "updated_at",
        # Machine
        "maquina", "equipo", "codigo", "codigo_maquina", "codigomaquina", "maquina_id",
        # Quantities
        "horas", "hs", "horas_normales", "horas_extras", "horas_50", "horas_100", "horas_adicionales",
        "horas_trabajadas", "horas_reales", "horas_imputadas", "horas_a_imputar", "hs_imputar", "hs_a_imputar",
        "cant", "q", "qty", "cantidad", "cantidad_horas", "kilometros", "kms", "km",
        # Money / Rates
        "precio", "precio_unitario", "preciounitario", "tarifa", "tarifa_hora", "costo", "costo_hora",
        "importe", "importe_total", "total", "subtotal", "valor", "monto", "total_imputado",
        # Details
        "concepto", "observaciones", "observacion", "descripcion", "detalle", "comentarios", "comentario",
        # Locations / Owners
        "unidad_de_negocio", "unidadnegocio", "sucursal", "obra", "centro_costo", "centrocosto", "empresa",
        # Audit / User
        "usuario", "usuario_carga", "fecha_carga", "creado_por", "modificado_por"
    ]
    
    existing = []
    print("Scanning columns in certificaciones_maquinas...")
    for c in candidates:
        if test_column(c):
            print(f"  FOUND: {c}")
            existing.append(c)
            
    print("\nScan complete. Discovered columns:", list(set(existing)))

if __name__ == '__main__':
    scan()
