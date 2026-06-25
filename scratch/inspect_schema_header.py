import urllib.request
import urllib.error

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def get_schema():
    url = f"{SUPABASE_URL}/rest/v1/certificaciones_maquinas"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}",
            "Accept": "application/schema+json"
        }
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            print("Response status:", response.status)
            body = response.read().decode('utf-8')
            print("Schema Body:")
            print(body)
    except urllib.error.HTTPError as e:
        print("HTTP Error code:", e.code)
        print("Response body:")
        print(e.read().decode('utf-8'))
    except Exception as e:
        print("Other error:", e)

if __name__ == '__main__':
    get_schema()
