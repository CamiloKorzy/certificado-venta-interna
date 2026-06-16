import jwt
import time
import requests
import urllib.parse

JWT_SECRET = "cert_ventas_interno_secret_2026"

token = jwt.encode({
    "sub": "test@test.com",
    "nombre": "Test",
    "rol": "admin",
    "exp": int(time.time()) + 3600
}, JWT_SECRET, algorithm="HS256")

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Delete TUCUMAN from centros-costo
url_cc = "https://certificado-venta-interna.vercel.app/api/config/centros-costo/TUCUMAN"
res = requests.post(url_cc, headers=headers, json=[])
print("TUCUMAN CC status:", res.status_code)

# Delete TUCUMAN from avanzada (gastos, ingresos)
# Wait, for avanzada, the endpoint is POST /api/config/avanzada/{tipo}/{sucursal}
# For gastos-compras
res = requests.post("https://certificado-venta-interna.vercel.app/api/config/avanzada/gastos-compras/TUCUMAN", headers=headers, json=[])
print("TUCUMAN gastos-compras status:", res.status_code)

res = requests.post("https://certificado-venta-interna.vercel.app/api/config/avanzada/gastos-asientos/TUCUMAN", headers=headers, json=[])
print("TUCUMAN gastos-asientos status:", res.status_code)

res = requests.post("https://certificado-venta-interna.vercel.app/api/config/avanzada/ingresos-comprobantes/TUCUMAN", headers=headers, json=[])
print("TUCUMAN ingresos status:", res.status_code)

