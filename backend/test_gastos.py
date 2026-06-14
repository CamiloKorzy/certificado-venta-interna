import sys
from dotenv import load_dotenv
load_dotenv('.env')

from main import get_informe_mensual_calculo_vivo

try:
    res = get_informe_mensual_calculo_vivo("Administración Oficina Central", "2024-05")
    print("Ingresos:", len(res["ingresos"]))
    print("Gastos:", len(res["gastos"]))
    if len(res["gastos"]) > 0:
        print("Sample Gasto:", res["gastos"][0])
except Exception as e:
    print("Error:", e)
