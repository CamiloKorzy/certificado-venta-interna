import urllib.request
import urllib.error
import json

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def test_table(table_name):
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?limit=5"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}",
        }
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            print(f"Table '{table_name}' status: {response.status} (Exists! Rows: {len(data)})")
            if data:
                print("First record keys:", data[0].keys())
                for k, v in data[0].items():
                    print(f"  {k}: {v}")
            return True
    except urllib.error.HTTPError as e:
        print(f"Table '{table_name}' status: {e.code} ({e.reason})")
        print(e.read().decode('utf-8'))
        return False
    except Exception as e:
        print(f"Table '{table_name}' error: {e}")
        return False

if __name__ == '__main__':
    test_table("certificados_detalle")
