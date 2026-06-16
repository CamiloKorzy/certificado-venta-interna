import sys
sys.path.append('backend')
import traceback
from dotenv import load_dotenv
load_dotenv('backend/.env')
import main

try:
    print(main.get_informe_mensual_calculo_vivo('Informática y Tecnología CEE ENRIQUEZ', '2026-04'))
except Exception as e:
    traceback.print_exc()
