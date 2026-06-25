import urllib.request

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def test_options():
    url = f"{SUPABASE_URL}/rest/v1/certificaciones_maquinas"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}",
        },
        method="OPTIONS"
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            print("Response code:", response.status)
            print("Headers:")
            for k, v in response.info().items():
                print(f"  {k}: {v}")
            body = response.read().decode('utf-8')
            print("Body:")
            print(body)
    except Exception as e:
        print("Error during OPTIONS request:", e)

if __name__ == '__main__':
    test_options()
