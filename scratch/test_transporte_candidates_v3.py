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
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        if "42703" in body or "does not exist" in body or "PGRST204" in body:
            return False
        else:
            return True
    except Exception as e:
        return False

if __name__ == '__main__':
    candidates = [
        "tarifa_neta_viaje", "tarifa_neta_tonelada", "tarifa_neta_tn",
        "precio_neto_viaje", "precio_neto_tonelada", "precio_neto_tn",
        "precio_viaje_neto", "precio_tonelada_neto", "precio_tn_neto",
        "valor_viaje_neto", "valor_tonelada_neto", "valor_tn_neto",
        "tarifa_viaje_neta", "tarifa_tonelada_neta", "tarifa_tn_neta",
        "tarifa_neto_viaje", "tarifa_neto_tonelada", "tarifa_neto_tn",
        "tarifa_tn", "precio_tn", "valor_tn", "monto_tn", "costo_tn", "importe_tn",
        "tarifa_flete_neta", "precio_flete_neto", "valor_flete_neto", "costo_flete_neto"
    ]
    
    print("=== Testing additional candidates V3 ===")
    found = []
    for cand in candidates:
        if check_col("tarifas_transporte", cand):
            print(f"  EXISTS: {cand}")
            found.append(cand)
            
    print(f"Discovered: {found}")
