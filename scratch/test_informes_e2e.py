import sys, json, requests
sys.path.append(r"c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend")

# 1. Login to get a real token
login_res = requests.post(
    "https://certificado-venta-interna.vercel.app/api/login",
    json={"email": "admin@ceeenriquez.com", "password": "admin123"}
)
print("Login status:", login_res.status_code)
if login_res.status_code != 200:
    print("Login body:", login_res.text[:500])
    sys.exit(1)

token = login_res.json().get("token")
print("Token obtained:", token[:30] + "...")

# 2. Call /api/informes/lista with that token
lista_res = requests.get(
    "https://certificado-venta-interna.vercel.app/api/informes/lista",
    headers={"Authorization": f"Bearer {token}"}
)
print("\nInformes lista status:", lista_res.status_code)
print("Informes lista body:", lista_res.text[:1000])
