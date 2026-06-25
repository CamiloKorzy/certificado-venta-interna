import urllib.request
import json

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def test_query():
    url = f"{SUPABASE_URL}/rest/v1/certificaciones_maquinas"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}",
        }
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            body = response.read().decode('utf-8')
            print("Response Status:", response.status)
            print("Response Body:", body)
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    test_query()
