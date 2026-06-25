import urllib.request
import urllib.error

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def test():
    cols = ["tarifa_neta", "tarifa_neta_viaje", "precio", "tarifa", "valor", "importe", "monto", "precio_unitario", "costo", "moneda", "producto", "id"]
    for col in cols:
        url = f"{SUPABASE_URL}/rest/v1/tarifas_transporte?select={col}&limit=1"
        req = urllib.request.Request(
            url,
            headers={
                "apikey": ANON_KEY,
                "Authorization": f"Bearer {ANON_KEY}"
            }
        )
        try:
            with urllib.request.urlopen(req) as r:
                print(f"[{col}] EXISTS (200) - Body: {r.read().decode('utf-8')}")
        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8')
            if "42703" in body or "does not exist" in body or "PGRST204" in body:
                print(f"[{col}] DOES NOT EXIST (HTTP {e.code})")
            else:
                print(f"[{col}] EXISTS (HTTP {e.code}) - Body: {body}")
        except Exception as e:
            print(f"[{col}] Error: {e}")

if __name__ == '__main__':
    test()
