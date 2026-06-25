import urllib.request
import urllib.error

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def try_select(table, col):
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
            print(f"[{col}] Success (200) - Body: {r.read().decode('utf-8')}")
    except urllib.error.HTTPError as e:
        print(f"[{col}] HTTP {e.code} - Body: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"[{col}] Error: {e}")

if __name__ == '__main__':
    try_select("certificaciones_transporte", "id")
    try_select("certificaciones_transporte", "nonexistent_col_abc")
    try_select("certificaciones_transporte", "patente")
    try_select("certificaciones_transporte", "unidad_de_negocio")
