import sys
sys.path.append('backend')
from dotenv import load_dotenv
load_dotenv('backend/.env')
import main

conn = main.get_aurora()
cur = conn.cursor()
cur.execute("SELECT comprobante FROM ceesa_cee_certificados_ventas_internas LIMIT 5")
print(cur.fetchall())
