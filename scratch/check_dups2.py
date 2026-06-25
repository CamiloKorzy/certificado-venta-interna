import sys
sys.path.append('backend')
from main import get_aurora
import pprint

conn = get_aurora()
cur = conn.cursor()
cur.execute("""
SELECT 
  COALESCE(NULLIF(comprobante, ''), NULLIF(documento, ''), 'UNKNOWN') as num_doc, 
  productonombre, 
  COUNT(*) 
FROM ceesa_cee_certificados_ventas_internas 
WHERE productonombre IS NOT NULL AND TRIM(productonombre) != '' 
GROUP BY 1, 2 
HAVING COUNT(*) > 1 
LIMIT 10
""")
pprint.pprint(cur.fetchall())
