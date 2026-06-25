import urllib.request
import urllib.error
import json

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def try_post(table_name, payload):
    url = f"{SUPABASE_URL}/rest/v1/{table_name}"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        },
        data=json.dumps(payload).encode('utf-8'),
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as response:
            return response.code, response.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return 500, str(e)

if __name__ == '__main__':
    print("=== Testing valid/invalid POST requests ===")
    code_valid, body_valid = try_post("certificaciones_transporte", {"id": 1})
    print(f"POST id: {code_valid} - {body_valid}")
    
    code_invalid, body_invalid = try_post("certificaciones_transporte", {"nonexistent_col_123": 1})
    print(f"POST nonexistent_col_123: {code_invalid} - {body_invalid}")
