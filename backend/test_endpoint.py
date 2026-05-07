import urllib.request
import json

url = "http://localhost:8000/api/indicadores"
req = urllib.request.Request(url)
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())
    
print("KPIs:", data['kpis'])
# Print unique values of EstadoAutorizacion
estados_auth = set()
for r in data['data']:
    if 'EstadoAutorizacion' in r:
        estados_auth.add(r['EstadoAutorizacion'])
print("Unique EstadoAutorizacion:", estados_auth)
