import urllib.request
import json

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def find_tariff():
    url = f"{SUPABASE_URL}/rest/v1/tarifas_equipos?codigo_equipo=eq.MD0001"
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
            print("Tariffs for MD0001:")
            for idx, r in enumerate(data):
                print(f"Row {idx}: {r}")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    find_tariff()
