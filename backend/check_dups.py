import psycopg2
import collections

try:
    conn = psycopg2.connect(
        host='ceesa.dw.finneg.com',
        port=5432,
        dbname='finnegansbi',
        user='ceesauser',
        password='Lula$$2014'
    )
    cur = conn.cursor()
    cur.execute("SELECT comprobante, documento, empresa, productonombre FROM ceesa_cee_certificados_ventas_internas")
    rows = cur.fetchall()
    
    docs_to_empresas = collections.defaultdict(set)
    docs_to_productos = collections.defaultdict(set)
    for c, d, e, p in rows:
        key = c if c and c != 'NULL' else d
        if not key or key == 'NULL':
            continue
        docs_to_empresas[key].add(e)
        docs_to_productos[key].add(p)
        
    print("Keys con múltiples empresas:", [k for k, v in docs_to_empresas.items() if len(v) > 1])
    print("Total keys:", len(docs_to_empresas))
except Exception as e:
    print(e)
