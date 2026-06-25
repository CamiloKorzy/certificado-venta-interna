import urllib.request
import json

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def test_query():
    url = f"{SUPABASE_URL}/rest/v1/certificaciones_maquinas?limit=5"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            print("Response code:", response.status)
            print("Total records returned (limit 5):", len(data))
            if data:
                print("First record keys:", data[0].keys())
                print("First record values:")
                for k, v in data[0].items():
                    print(f"  {k}: {v}")
    except Exception as e:
        print("Error during request:", e)

if __name__ == '__main__':
    test_query()
