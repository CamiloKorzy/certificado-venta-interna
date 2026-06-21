import jwt
import time
import requests
import urllib.parse

# Secret from .env
JWT_SECRET = "cert_ventas_interno_secret_2026"

token = jwt.encode({
    "sub": "test@test.com",
    "nombre": "Test",
    "rol": "admin",
    "exp": int(time.time()) + 3600
}, JWT_SECRET, algorithm="HS256")

unidad = "Seguridad de Activos"
periodo = "2026-05"

url = f"https://certificado-venta-interna.vercel.app/api/informes/mensual?unidad_negocio={urllib.parse.quote(unidad)}&periodo={periodo}"
print("Fetching:", url)
res = requests.get(url, headers={"Authorization": f"Bearer {token}"})
print(res.status_code)
print(res.text)
