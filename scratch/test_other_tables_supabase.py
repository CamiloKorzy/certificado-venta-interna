import urllib.request
import urllib.error

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def test_table(table_name):
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?limit=1"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}",
        }
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Table '{table_name}' status: {response.status} (Exists!)")
            return True
    except urllib.error.HTTPError as e:
        print(f"Table '{table_name}' status: {e.code} ({e.reason})")
        return False
    except Exception as e:
        print(f"Table '{table_name}' error: {e}")
        return False

def run():
    tables = ["certificaciones_maquinas", "cert_equipos_partes", "equipos", "maquinas", "certificaciones"]
    for t in tables:
        test_table(t)

if __name__ == '__main__':
    run()
