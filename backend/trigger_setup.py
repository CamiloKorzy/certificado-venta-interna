from dotenv import load_dotenv
load_dotenv('c:/Datos/Proyectos IT/Certificado_Venta_Interna/backend/.env')

from main import auto_setup_db
auto_setup_db()
print("Setup done.")
