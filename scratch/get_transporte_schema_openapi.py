import urllib.request
import json

def get_schema():
    apikey = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"
    url = "https://naxjzquhdzyoxtjataaw.supabase.co/rest/v1/"
    
    headers = {
        "apikey": apikey,
        "Authorization": f"Bearer {apikey}"
    }
    
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            spec = json.loads(response.read().decode('utf-8'))
            
            # Find definitions
            definitions = spec.get("definitions", {})
            print("Found definitions:", list(definitions.keys()))
            
            for table in ["certificaciones_transporte", "tarifas_transporte", "certificaciones_tranporte"]:
                if table in definitions:
                    print(f"\n=== Schema for {table} ===")
                    properties = definitions[table].get("properties", {})
                    for prop, details in properties.items():
                        print(f"  {prop}: {details.get('type')} ({details.get('format', '')}) - {details.get('description', '')}")
                else:
                    print(f"\nTable {table} not found in definitions.")
    except Exception as e:
        print(f"Error fetching OpenAPI spec: {e}")

if __name__ == '__main__':
    get_schema()
