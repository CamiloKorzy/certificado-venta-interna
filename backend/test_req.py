import requests

def run():
    try:
        r = requests.get('http://127.0.0.1:8000/api/asientos?unidad_negocio=Seguridad%20de%20Activos&periodo=05/2026')
        print(f"Status: {r.status_code}")
        print(r.text)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    run()
