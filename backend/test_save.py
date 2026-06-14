import sys
from dotenv import load_dotenv
load_dotenv('.env')

from main import save_config_centros_costo

try:
    res = save_config_centros_costo("Test Sucursal", [{"id_ref": "123", "codigo": "TEST", "nombre": "TEST"}])
    print(res)
except Exception as e:
    print("Error:", e)
