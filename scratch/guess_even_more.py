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
        "horas_horometro", "horas_maquina", "horas_equipo", "cant", "q", "qty", 
        "costo", "valor", "total_importe", "unidaddenegocio", "unidad_de_negocio", 
        "udn", "centrocosto", "costo_centro", "rubro", "categoria", "concepto_nombre", 
        "operario", "maquinista", "conductor", "chofer", "empleado", "empleado_nombre", 
        "observacion", "comentario", "detalles", "novedades", "novedad", "imputacion", 
        "fecha_carga", "usuario_carga", "horas_50", "horas_100", "adicionales"
    ]
    
    existing_cols = []
    
    for cand in candidates:
        code, body = try_post({cand: "test_val"})
        if "schema cache" in body:
            # Column doesn't exist
            pass
        else:
            # Column exists!
            print(f"Column EXISTS: {cand} (Response: {code} - {body[:100]})")
            existing_cols.append(cand)
            
    print("\nDiscovered existing columns:", existing_cols)

if __name__ == '__main__':
    discover()
