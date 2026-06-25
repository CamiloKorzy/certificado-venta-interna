import sys
sys.path.append(r"c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend")
from main import get_indicadores

res = get_indicadores(user={"rol": "admin"})

seguridad = [r for r in res["data"] if r.get("Empresa", "").lower() == "seguridad de activos"]
print("Total Seguridad de Activos:", len(seguridad))
for r in seguridad:
    print(r.get("Empresa"), r.get("Fecha"), r.get("Total Bruto"), r.get("EstadoAutorizacion"))
