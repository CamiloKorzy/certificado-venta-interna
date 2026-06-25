import urllib.request
import json

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def read_all():
    url = f"{SUPABASE_URL}/rest/v1/equipos"
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
            print("Total rows in remote equipos:", len(data))
            for idx, row in enumerate(data):
                print(f"\nRow {idx}:")
                for k, v in row.items():
                    print(f"  {k}: {v}")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    read_all()
