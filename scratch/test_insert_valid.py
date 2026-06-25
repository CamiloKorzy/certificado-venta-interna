import urllib.request
import urllib.error
import json

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def test_insert():
    url = f"{SUPABASE_URL}/rest/v1/certificaciones_maquinas"
    
    payload = {
        "maquina": "M0169/Camioneta",
        "mes": 5,
        "anio": 2026,
        "observaciones": "Certificación de prueba",
        "unidad_de_negocio": "Seguridad de Activos"
    }
    
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
            print("Insert Success! Response:")
            print(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print("HTTP Error code:", e.code)
        print("Error response body:")
        print(e.read().decode('utf-8'))
    except Exception as e:
        print("Other error:", e)

if __name__ == '__main__':
    test_insert()
