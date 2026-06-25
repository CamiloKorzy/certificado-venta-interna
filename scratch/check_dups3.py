import sys
sys.path.append('backend')
from main import get_aurora
import pprint

conn = get_aurora()
cur = conn.cursor()
cur.execute("""
SELECT comprobante, documento, productonombre, itemcantidad, itemimporte 
FROM ceesa_cee_certificados_ventas_internas 
WHERE documento = 'CERTIFICADO_VENTA_INTERNO - 41'
""")
pprint.pprint(cur.fetchall())
