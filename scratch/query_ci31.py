import sys
import pprint
sys.path.append('backend')
from main import get_aurora

conn = get_aurora()
cur = conn.cursor()
cur.execute("SELECT comprobante, documento, productonombre, itemimporte FROM ceesa_cee_certificados_ventas_internas WHERE comprobante LIKE '%31%'")
rows = cur.fetchall()
columns = [desc[0] for desc in cur.description]
data = [dict(zip(columns, row)) for row in rows]
pprint.pprint(data)
