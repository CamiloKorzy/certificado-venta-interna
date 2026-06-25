import urllib.request
import urllib.parse
import json

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def query_with_filter(filter_str):
    url = f"{SUPABASE_URL}/rest/v1/certificaciones_maquinas?{filter_str}"
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
            if data:
                print(f"Filter '{filter_str}' returned {len(data)} rows! Sample:")
                print(data[0])
                return data
            else:
                print(f"Filter '{filter_str}' returned 0 rows.")
    except Exception as e:
        print(f"Filter '{filter_str}' error: {e}")
    return None

def run():
    filters = [
        "mes=eq.5&anio=eq.2026",
        "mes=eq.6&anio=eq.2026",
        "anio=eq.2026",
        "mes=eq.5",
        "mes=eq.6",
        "unidad_de_negocio=not.is.null",
        "maquina=not.is.null"
    ]
    
    for f in filters:
        res = query_with_filter(f)
        if res:
            break

if __name__ == '__main__':
    run()
