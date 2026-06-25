import urllib.request
import json

def check():
    import urllib.request
    import json
    
    apikey = "sb_publishable_K3r5ogAi25D2ffI6-9cWLg_VJddbdxF"
    
    # 1. Query certificaciones_maquinas row count
    req1 = urllib.request.Request(
        "https://naxjzquhdzyoxtjataaw.supabase.co/rest/v1/certificaciones_maquinas?select=count",
        headers={"apikey": apikey, "Authorization": f"Bearer {apikey}", "Prefer": "count=exact"}
    )
    try:
        with urllib.request.urlopen(req1) as res:
            print("certificaciones_maquinas headers:", res.headers)
    except Exception as e:
        print("Error checking certificaciones_maquinas:", e)

    # 2. Query equipos row count
    req2 = urllib.request.Request(
        "https://naxjzquhdzyoxtjataaw.supabase.co/rest/v1/equipos?select=count",
        headers={"apikey": apikey, "Authorization": f"Bearer {apikey}", "Prefer": "count=exact"}
    )
    try:
        with urllib.request.urlopen(req2) as res:
            print("equipos headers:", res.headers)
    except Exception as e:
        print("Error checking equipos:", e)

    # 3. Fetch first 5 items from equipos
    req3 = urllib.request.Request(
        "https://naxjzquhdzyoxtjataaw.supabase.co/rest/v1/equipos?limit=5",
        headers={"apikey": apikey, "Authorization": f"Bearer {apikey}"}
    )
    try:
        with urllib.request.urlopen(req3) as res:
            data = json.loads(res.read().decode('utf-8'))
            print(f"equipos first 5 items: {len(data)}")
            if data:
                print("First item keys:", data[0].keys())
                for k, v in data[0].items():
                    print(f"  {k}: {v}")
    except Exception as e:
        print("Error fetching equipos:", e)

    # 4. Fetch first 5 items from certificaciones_maquinas
    req4 = urllib.request.Request(
        "https://naxjzquhdzyoxtjataaw.supabase.co/rest/v1/certificaciones_maquinas?limit=5",
        headers={"apikey": apikey, "Authorization": f"Bearer {apikey}"}
    )
    try:
        with urllib.request.urlopen(req4) as res:
            data = json.loads(res.read().decode('utf-8'))
            print(f"certificaciones_maquinas first 5 items: {len(data)}")
            if data:
                print("First item keys:", data[0].keys())
                for k, v in data[0].items():
                    print(f"  {k}: {v}")
    except Exception as e:
        print("Error fetching certificaciones_maquinas:", e)
                
if __name__ == "__main__":
    check()
