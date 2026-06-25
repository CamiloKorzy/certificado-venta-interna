import urllib.request
import urllib.error

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def get_csv_header(table):
    url = f"{SUPABASE_URL}/rest/v1/{table}?limit=1"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}",
            "Accept": "text/csv"
        }
    )
    try:
        with urllib.request.urlopen(req) as r:
            body = r.read().decode('utf-8')
            print(f"\n=== CSV Header for {table} ===")
            print(body.strip())
    except urllib.error.HTTPError as e:
        print(f"[{table}] HTTP {e.code} - Body: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"[{table}] Error: {e}")

if __name__ == '__main__':
    get_csv_header("certificaciones_transporte")
    get_csv_header("tarifas_transporte")
