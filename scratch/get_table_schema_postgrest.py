import urllib.request
import json

def get_table_schema(table_name):
    apikey = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"
    url = f"https://naxjzquhdzyoxtjataaw.supabase.co/rest/v1/{table_name}"
    
    headers = {
        "apikey": apikey,
        "Authorization": f"Bearer {apikey}",
        "Accept": "application/schema+json"
    }
    
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            schema = json.loads(response.read().decode('utf-8'))
            print(f"\n=== Schema for {table_name} ===")
            print(json.dumps(schema, indent=2))
    except Exception as e:
        print(f"Error fetching schema for {table_name}: {e}")

if __name__ == '__main__':
    get_table_schema("certificaciones_transporte")
    get_table_schema("tarifas_transporte")
