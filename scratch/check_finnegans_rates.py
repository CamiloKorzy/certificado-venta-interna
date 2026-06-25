import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend/.env')))

from main import get_aurora

def check_rates():
    conn = get_aurora()
    cur = conn.cursor()
    
    print("=== Finnegans billing prices containing MD0001 or Movil ===")
    cur.execute("""
        SELECT DISTINCT productonombre, itemprecio, itemimporte, comprobante, fecha
        FROM ceesa_cee_certificados_ventas_internas
        WHERE (productonombre ILIKE '%MD0001%' OR productonombre ILIKE '%Movil%')
          AND EXTRACT(YEAR FROM CAST(fecha AS TIMESTAMP)) = 2026
          AND EXTRACT(MONTH FROM CAST(fecha AS TIMESTAMP)) = 5
    """)
    rows = cur.fetchall()
    for r in rows:
        print(f"Product: {r[0]} | Price: {r[1]} | Importe: {r[2]} | Comprobante: {r[3]} | Fecha: {r[4]}")
        
    print("\n=== Work logs in Finnegans containing MD0001 or Movil ===")
    cur.execute("""
        SELECT DISTINCT maquina, codigomaquina, horastrabajadas, fecha, centrodecosto
        FROM ceesa_cee_equipos_trabajos_realizados
        WHERE (maquina ILIKE '%MD0001%' OR codigomaquina ILIKE '%MD0001%' OR maquina ILIKE '%Movil%')
          AND EXTRACT(YEAR FROM CAST(fecha AS TIMESTAMP)) = 2026
          AND EXTRACT(MONTH FROM CAST(fecha AS TIMESTAMP)) = 5
    """)
    rows_work = cur.fetchall()
    for r in rows_work:
        print(f"Maquina: {r[0]} | Codigo: {r[1]} | Horas: {r[2]} | Fecha: {r[3]} | CC: {r[4]}")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    check_rates()
