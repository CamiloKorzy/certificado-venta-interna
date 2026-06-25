import urllib.request
import urllib.error

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def check_col(table, col):
    url = f"{SUPABASE_URL}/rest/v1/{table}?select={col}&limit=1"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}"
        }
    )
    try:
        with urllib.request.urlopen(req) as r:
            return True, r.code, ""
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        if "42703" in body or "does not exist" in body or "PGRST204" in body:
            return False, e.code, body
        else:
            return True, e.code, body
    except Exception as e:
        return False, 500, str(e)

if __name__ == '__main__':
    candidates = [
        "valor", "tarifa_tonelada", "precio_tonelada", "precio_viaje", "precio_km",
        "precio_fijo", "monto_viaje", "monto_tonelada", "monto_km", "valor_viaje",
        "valor_tonelada", "valor_km", "tarifa_por_viaje", "tarifa_por_tonelada",
        "tarifa_por_km", "precio_por_viaje", "precio_por_tonelada", "precio_por_km",
        "valor_por_viaje", "valor_por_tonelada", "valor_por_km", "tarifa_neta",
        "unidad_de_negocio", "unidad_negocio", "proveedor", "transportista", "chofer",
        "patente", "origen", "destino", "distancia", "distancia_km", "km",
        "tipo_vehiculo", "tipo_transporte", "codigo", "nombre", "periodo", "mes", "anio"
    ]
    
    print("=== Testing additional candidates for tarifas_transporte ===")
    found = []
    for cand in candidates:
        exists, code, msg = check_col("tarifas_transporte", cand)
        if exists:
            print(f"  EXISTS: {cand} (Code: {code})")
            found.append(cand)
            
    print(f"Discovered: {found}")
