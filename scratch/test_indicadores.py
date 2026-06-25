import sys
sys.path.append(r"c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend")
from main import get_indicadores

try:
    res = get_indicadores(user={"rol": "admin"})
    print("Success. Records length:", len(res["data"]))
except Exception as e:
    import traceback
    traceback.print_exc()
