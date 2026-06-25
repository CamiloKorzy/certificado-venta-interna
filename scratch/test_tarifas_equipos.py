import urllib.request
import json

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def test_tarifas():
    url = f"{SUPABASE_URL}/rest/v1/tarifas_equipos?limit=5"
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
            print("Total rows in remote tarifas_equipos:", len(data))
            if data:
                print("First record keys:", data[0].keys())
                for idx, r in enumerate(data):
                    print(f"Row {idx}: {r}")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    test_tarifas()
