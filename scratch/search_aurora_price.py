import sys
import os
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
load_dotenv(dotenv_path=os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend/.env')))

from main import get_aurora

def check():
    conn = get_aurora()
    cur = conn.cursor()
    
    print("Searching for price 25859.78 in ceesa_cee_certificados_ventas_internas...")
    cur.execute("""
        SELECT DISTINCT productonombre, itemprecio, itemimporte, fecha, comprobante, empresa
        FROM ceesa_cee_certificados_ventas_internas
        WHERE itemprecio BETWEEN 25859 AND 25860 OR itemimporte BETWEEN 4473741 AND 4473742
    """)
    rows = cur.fetchall()
    for r in rows:
        print(f"Product: {r[0]} | Price: {r[1]} | Importe: {r[2]} | Fecha: {r[3]} | Comp: {r[4]} | Empresa: {r[5]}")
        
    cur.close()
    conn.close()

if __name__ == '__main__':
    check()
