import urllib.request
import json

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def get_schema():
    url = f"{SUPABASE_URL}/rest/v1"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}"
        }
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            openapi = json.loads(response.read().decode('utf-8'))
            print("OpenAPI title:", openapi.get("info", {}).get("title"))
            definitions = openapi.get("definitions", {})
            print("Available tables:")
            for table in definitions.keys():
                print(f"  - {table}")
    except Exception as e:
        print("Error fetching OpenAPI schema:", e)

if __name__ == '__main__':
    get_schema()
