import urllib.request
import urllib.error
import json

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def try_post(table_name, payload):
    url = f"{SUPABASE_URL}/rest/v1/{table_name}"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        },
        data=json.dumps(payload).encode('utf-8'),
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as response:
            return 200, response.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return 500, str(e)

def discover(table_name):
    print(f"\n--- Discovering columns for {table_name} ---")
    candidates = [
        "id", "created_at", "unidad_de_negocio", "mes", "anio", "observaciones",
        "fecha_certificacion", "fecha", "patente", "chofer", "remito", "origen",
        "destino", "distancia_km", "cantidad_viajes", "tarifa_viaje", "valor_total",
        "monto", "total", "producto", "material", "equipo", "maquina", "tipo_transporte",
        "proveedor", "precio_unitario", "precio", "cantidad", "concepto", "viajes",
        "km", "litros", "toneladas", "remitos", "choferes", "transportista", "patentes",
        "tipo_vehiculo", "tarifa_neta", "tarifa_km", "tarifa_fija", "tarifa", "moneda",
        "fecha_inicio", "fecha_fin", "codigo_transporte", "codigo", "nombre", "comitente",
        "obra", "unidad_medida", "viajes_realizados", "km_recorridos", "chofer_nombre"
    ]
    
    existing_cols = []
    for cand in candidates:
        # Determine value type to avoid value type validation errors if column exists
        is_num = any(x in cand.lower() for x in ["id", "mes", "anio", "distancia", "cantidad", "tarifa", "valor", "monto", "total", "precio", "viajes", "km", "litros", "toneladas"])
        val = 1.0 if is_num else "test_val"
        
        code, body = try_post(table_name, {cand: val})
        
        # If the column does not exist, PostgreSQL error will say "column ... of relation ... does not exist"
        # If the column exists, it might say "null value in column" or "violates foreign key/unique" or succeed (200/201)
        # If the column does not exist, PostgREST returns PGRST204
        if "PGRST204" in body or "Could not find the" in body:
            pass
        else:
            print(f"  Column EXISTS: {cand} (Response: {code} - {body[:100]})")
            existing_cols.append(cand)
            
    print(f"Discovered for {table_name}: {existing_cols}")

if __name__ == '__main__':
    discover("certificaciones_transporte")
    discover("tarifas_transporte")
