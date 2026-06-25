import sys
import os
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
load_dotenv(dotenv_path=os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend/.env')))

from main import get_aurora

def check():
    conn = get_aurora()
    cur = conn.cursor()
    
    print("=== Finnegans billing prices for MD0001 or Movil (All Periods) ===")
    cur.execute("""
        SELECT DISTINCT productonombre, itemprecio, fecha, comprobante, empresa
        FROM ceesa_cee_certificados_ventas_internas
        WHERE (productonombre ILIKE '%MD0001%' OR productonombre ILIKE '%Movil%')
        ORDER BY fecha DESC
        LIMIT 20
    """)
    rows = cur.fetchall()
    for r in rows:
        print(f"Product: {r[0]} | Price: {r[1]} | Fecha: {r[2]} | Comp: {r[3]} | Empresa: {r[4]}")
        
    cur.close()
    conn.close()

if __name__ == '__main__':
    check()
