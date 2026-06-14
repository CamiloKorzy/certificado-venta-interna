import sys
import os
sys.path.append(os.path.abspath('c:\\Datos\\Proyectos IT\\Certificado_Venta_Interna\\backend'))
import main
import traceback

user_dict = {
    "email": "camilo.k@ceeenriquez.com",
    "rol": "user",
    "id": 123
}

# Mock the get_supabase function to not hit the real network, 
# and just return a mock cursor that returns the known sucursales.
class MockCursor:
    def execute(self, *args, **kwargs): pass
    def fetchall(self): return [["Informática y Tecnología CEE ENRIQUEZ"], ["Seguridad de Activos"]]
    def close(self): pass

class MockConn:
    def cursor(self): return MockCursor()
    def close(self): pass

main.get_supabase = lambda: MockConn()

try:
    res = main.get_indicadores(user_dict)
    print("SUCCESS")
    print("ROWS RETURNED:", len(res['data']))
    if len(res['data']) > 0:
        print("FIRST ROW:", res['data'][0])
except Exception as e:
    print("EXCEPTION CAUGHT")
    traceback.print_exc()
