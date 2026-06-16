import requests
import sys

def test_rrhh():
    url = "http://127.0.0.1:8000/api/rrhh?empresa=Seguridad%20de%20Activos&periodo=05-2026"
    r = requests.get(url)
    print("Status 05-2026:", r.status_code)
    try:
        print(r.json())
    except:
        print(r.text)
        
    url2 = "http://127.0.0.1:8000/api/rrhh?empresa=Seguridad%20de%20Activos&periodo=06-2026"
    r2 = requests.get(url2)
    print("Status 06-2026:", r2.status_code)
    try:
        print(r2.json())
    except:
        print(r2.text)

if __name__ == "__main__":
    test_rrhh()
