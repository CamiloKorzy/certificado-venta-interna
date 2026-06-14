import os
import sys

sys.path.append(os.path.abspath('c:\\Datos\\Proyectos IT\\Certificado_Venta_Interna\\backend'))
from main import get_informe_mensual_calculo_vivo, get_supabase, get_aurora

try:
    data = get_informe_mensual_calculo_vivo("Seguridad de Activos", "2026-04")
    print("Success:", len(data.get("ingresos", [])), "ingresos")
except Exception as e:
    import traceback
    traceback.print_exc()
