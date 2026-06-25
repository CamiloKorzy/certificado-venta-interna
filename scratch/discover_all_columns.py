import urllib.request
import urllib.error
import json

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def try_post(payload):
    url = f"{SUPABASE_URL}/rest/v1/certificaciones_maquinas"
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
            return 200, response.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return 500, str(e)

def discover():
    candidates = [
        "id", "created_at", "maquina", "unidad_de_negocio", "mes", "anio", "observaciones",
        "fecha", "fecha_certificacion", "fecha_carga", "horas_registro", "horas_a_cobrar",
        "disponibilidad", "utilizacion", "tarifa_horaria", "valor_total", "horas_trabajadas",
        "horas_imputables", "monto", "precio_unitario", "total", "operario", "maquinista",
        "tarea", "trabajo", "comitente", "obra", "detalles_trabajos", "operarios"
    ]
    
    existing_cols = []
    for cand in candidates:
        code, body = try_post({cand: 1.0 if "horas" in cand or "tarifa" in cand or "valor" in cand or "disponibilidad" in cand or "utilizacion" in cand or "monto" in cand or "precio" in cand or "total" in cand or cand in ("mes", "anio") else "test_val"})
        if "does not exist" in body:
            pass
        else:
            print(f"Column EXISTS: {cand} (Response: {code} - {body[:150]})")
            existing_cols.append(cand)
            
    print("\nDiscovered existing columns:", existing_cols)

if __name__ == '__main__':
    discover()
