import urllib.request
import urllib.error

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def test_invalid_column():
    url = f"{SUPABASE_URL}/rest/v1/certificaciones_maquinas?select=nonexistent_column"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}",
        }
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            print("Success! (Unlikely):", response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print("HTTP Error code:", e.code)
        print("Error response headers:")
        for k, v in e.headers.items():
            print(f"  {k}: {v}")
        print("Error response body:")
        print(e.read().decode('utf-8'))
    except Exception as e:
        print("Other error:", e)

if __name__ == '__main__':
    test_invalid_column()
