import requests

r = requests.get('https://finnegans-bi-test.vercel.app/api/informes/mensual?unidad_negocio=Seguridad%20de%20Activos&periodo=2026-05')
data = r.json()
ingresos = data.get('ingresos', [])
cert_31 = [i for i in ingresos if i.get('comprobante') == 'CERTIFICADO_VENTA_INTERNO - 31']
for c in cert_31:
    print(c)
print("Total Gastos:", data.get('totales', {}).get('gastos'))
print("Total Ingresos:", data.get('totales', {}).get('ingresos'))
