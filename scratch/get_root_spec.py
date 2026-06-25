import urllib.request
import urllib.error

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def try_spec(url):
    req = urllib.request.Request(
        url,
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}"
        }
    )
    try:
        with urllib.request.urlopen(req) as r:
            body = r.read().decode('utf-8')
            print(f"[{url}] SUCCESS (200) - Length: {len(body)}")
            print(body[:500])
    except urllib.error.HTTPError as e:
        print(f"[{url}] HTTP {e.code} - Body: {e.read().decode('utf-8')[:300]}")
    except Exception as e:
        print(f"[{url}] Error: {e}")

if __name__ == '__main__':
    try_spec(f"{SUPABASE_URL}/rest/v1")
    try_spec(f"{SUPABASE_URL}/rest/v1/")
    try_spec(f"{SUPABASE_URL}/")
