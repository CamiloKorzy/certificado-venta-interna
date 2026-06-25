import urllib.request
import urllib.error
import json

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def check_equipos():
    # 1. Query rows
    url = f"{SUPABASE_URL}/rest/v1/equipos?limit=5"
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
            print("equipos rows count:", len(data))
            if data:
                print("First row keys:", data[0].keys())
                print("First row:", data[0])
    except Exception as e:
        print("Error reading equipos:", e)

    # 2. Trigger invalid column to see columns list
    url_invalid = f"{SUPABASE_URL}/rest/v1/equipos?select=nonexistent"
    req_invalid = urllib.request.Request(
        url_invalid,
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}",
        }
    )
    try:
        with urllib.request.urlopen(req_invalid) as response:
            pass
    except urllib.error.HTTPError as e:
        print("Invalid column error on equipos:")
        print(e.read().decode('utf-8'))
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    check_equipos()
