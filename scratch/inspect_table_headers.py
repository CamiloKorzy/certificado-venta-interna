import urllib.request

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def check_headers():
    url = f"{SUPABASE_URL}/rest/v1/certificaciones_maquinas"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}",
            "Prefer": "count=exact"
        },
        method="HEAD"
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            print("Response status:", response.status)
            print("Response headers:")
            for k, v in response.info().items():
                print(f"  {k}: {v}")
    except Exception as e:
        print("Error during HEAD request:", e)

if __name__ == '__main__':
    check_headers()
