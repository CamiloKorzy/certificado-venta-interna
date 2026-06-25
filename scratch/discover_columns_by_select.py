import urllib.request
import urllib.error
import json

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def check_column_exists(table_name, col_name):
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?select={col_name}&limit=1"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}"
        }
    )
    try:
        with urllib.request.urlopen(req) as response:
            # 200 OK means the column exists (even if response is empty list [])
            return True, response.code, ""
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        if "42703" in body or "does not exist" in body or "PGRST204" in body:
            return False, e.code, body
        else:
            # Other errors mean the column exists
            return True, e.code, body
    except Exception as e:
        return False, 500, str(e)

def discover(table_name):
    print(f"\n--- Discovering columns for {table_name} via SELECT ---")
    candidates = [
        "id", "created_at", "updated_at", "unidad_de_negocio", "unidad_negocio", "mes", "anio", "periodo",
        "observaciones", "fecha_certificacion", "fecha", "fecha_carga", "fecha_inicio", "fecha_fin",
        "patente", "patentes", "chofer", "choferes", "chofer_nombre", "remito", "remitos",
        "origen", "destino", "distancia", "distancia_km", "km", "km_recorridos",
        "viajes", "viajes_realizados", "cantidad_viajes", "cantidad", "toneladas", "litros", "peso",
        "producto", "producto_nombre", "material", "insumo", "equipo", "maquina",
        "tarifa", "tarifa_neta", "tarifa_viaje", "tarifa_km", "tarifa_fija", "precio", "precio_unitario", "importe", "monto", "total", "valor_total", "costo",
        "tipo_transporte", "tipo_vehiculo", "proveedor", "transportista", "moneda",
        "codigo", "codigo_transporte", "nombre", "comitente", "obra", "unidad_medida",
        "usuario_carga", "usuario_certificador"
    ]
    
    existing_cols = []
    for cand in candidates:
        exists, code, msg = check_column_exists(table_name, cand)
        if exists:
            print(f"  Column EXISTS: {cand} (Code: {code})")
            existing_cols.append(cand)
            
    print(f"Discovered for {table_name}: {existing_cols}")

if __name__ == '__main__':
    discover("certificaciones_transporte")
    discover("tarifas_transporte")
