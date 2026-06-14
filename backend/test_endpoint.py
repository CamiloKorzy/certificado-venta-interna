import requests

url = "https://certificado-venta-interna.vercel.app/api/config/centros-costo/TUCUMAN"
payload = [{"id_ref": "123", "codigo": "001", "nombre": "TEST"}]

response = requests.post(url, json=payload)
print(response.status_code)
print(response.text)
