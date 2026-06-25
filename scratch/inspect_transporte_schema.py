import urllib.request
import json

def inspect():
    apikey = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"
    base_url = "https://naxjzquhdzyoxtjataaw.supabase.co/rest/v1"
    
    headers = {
        "apikey": apikey,
        "Authorization": f"Bearer {apikey}"
    }
    
    tables = ["certificaciones_tranporte", "certificaciones_transporte", "tarifas_transporte"]
    
    for table in tables:
        print(f"\n=== Inspecting {table} ===")
        url = f"{base_url}/{table}?limit=2"
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode('utf-8'))
                if data:
                    print(f"Sample row keys: {list(data[0].keys())}")
                    print(f"Sample data:")
                    print(json.dumps(data, indent=2))
                else:
                    print("Table is empty (returned []).")
        except Exception as e:
            print(f"Error inspecting {table}: {e}")

if __name__ == '__main__':
    inspect()
