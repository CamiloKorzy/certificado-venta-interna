import urllib.request
import urllib.error

SUPABASE_URL = "https://naxjzquhdzyoxtjataaw.supabase.co"
ANON_KEY = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"

def check_col(table, col):
    url = f"{SUPABASE_URL}/rest/v1/{table}?select={col}&limit=1"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}"
        }
    )
    try:
        with urllib.request.urlopen(req) as r:
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        if "42703" in body or "does not exist" in body or "PGRST204" in body:
            return False
        else:
            return True
    except Exception as e:
        return False

if __name__ == '__main__':
    # Massive list of candidate column names for rates/prices/values/totals/costs
    candidates = [
        # Rate / Tarifa variations
        "tarifa", "tarifa_neta", "tarifa_neto", "tarifa_bruta", "tarifa_bruto",
        "tarifa_unitaria", "tarifa_unitario", "tarifa_valor", "tarifa_monto",
        "tarifa_viaje", "tarifa_km", "tarifa_fija", "tarifa_tonelada", "tarifa_tn",
        "tarifa_por_viaje", "tarifa_por_tonelada", "tarifa_por_km", "tarifa_flete",
        "tarifa_transporte", "tarifa_basica", "tarifa_base", "tarifa_pactada",
        
        # Price / Precio variations
        "precio", "precio_unitario", "precio_unitaria", "precio_neto", "precio_neta",
        "precio_bruto", "precio_bruta", "precio_viaje", "precio_tonelada", "precio_tn",
        "precio_km", "precio_fijo", "precio_flete", "precio_base", "precio_basico",
        "precio_por_viaje", "precio_por_tonelada", "precio_por_km",
        
        # Value / Valor variations
        "valor", "valor_unitario", "valor_unitario_neto", "valor_neto", "valor_bruto",
        "valor_viaje", "valor_tonelada", "valor_km", "valor_flete", "valor_base",
        "valor_por_viaje", "valor_por_tonelada", "valor_por_km", "valor_total",
        
        # Amount / Monto variations
        "monto", "monto_unitario", "monto_neto", "monto_bruto", "monto_viaje",
        "monto_tonelada", "monto_km", "monto_flete", "monto_base", "monto_por_viaje",
        "monto_por_tonelada", "monto_por_km",
        
        # Cost / Costo variations
        "costo", "costo_unitario", "costo_neto", "costo_bruto", "costo_viaje",
        "costo_tonelada", "costo_km", "costo_flete", "costo_base",
        
        # Importe / Import variations
        "importe", "importe_unitario", "importe_neto", "importe_bruto", "importe_viaje",
        "importe_tonelada", "importe_km", "importe_flete", "importe_base",
        
        # Transportation synonyms and specific codes
        "transportista", "chofer", "patente", "tipo_vehiculo", "tipo_transporte",
        "origen", "destino", "distancia", "distancia_km", "km", "cantidad",
        "toneladas", "viajes", "insumo", "producto", "moneda", "codigo",
        
        # Other potential names
        "rate", "price", "amount", "cost", "value", "net_rate", "unit_price",
        "unit_rate", "base_rate", "trip_rate", "ton_rate", "km_rate", "fixed_rate",
        "flete", "flete_neto", "flete_bruto", "flete_tarifa", "flete_precio"
    ]
    
    # Deduplicate candidates
    candidates = list(set(candidates))
    
    print(f"Testing {len(candidates)} candidates on tarifas_transporte...")
    found = []
    for cand in candidates:
        if check_col("tarifas_transporte", cand):
            print(f"  EXISTS: {cand}")
            found.append(cand)
            
    print(f"Total discovered in tarifas_transporte: {found}")
    
    print("\nTesting on certificaciones_transporte...")
    found_cert = []
    for cand in candidates:
        if check_col("certificaciones_transporte", cand):
            print(f"  EXISTS: {cand}")
            found_cert.append(cand)
            
    print(f"Total discovered in certificaciones_transporte: {found_cert}")
