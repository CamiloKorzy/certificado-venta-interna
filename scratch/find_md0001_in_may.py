import urllib.request
import json

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def test():
    url = f"{SUPABASE_URL}/rest/v1/certificaciones_maquinas?anio=eq.2026&mes=eq.5&maquina=ilike.*MD0001*"
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
            print(f"MD0001 certifications in May 2026: {len(data)}")
            for idx, r in enumerate(data):
                print(f"Row {idx}:")
                for k, v in r.items():
                    print(f"  {k}: {v}")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    test()
