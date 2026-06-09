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
    cur.execute("SELECT comprobante, documento, cliente, productonombre, equiposolicitantenombre FROM ceesa_cee_certificados_ventas_internas")
    rows = cur.fetchall()
    
    docs_to_clientes = collections.defaultdict(set)
    docs_to_productos = collections.defaultdict(set)
    docs_to_uns = collections.defaultdict(set)
    for c, d, cli, p, u in rows:
        key = c if c and c != 'NULL' else d
        if not key or key == 'NULL':
            continue
        docs_to_clientes[key].add(cli)
        docs_to_productos[key].add(p)
        docs_to_uns[key].add(u)
        
    print("Keys con múltiples clientes:", len([k for k, v in docs_to_clientes.items() if len(v) > 1]))
    print("Keys con múltiples productos:", len([k for k, v in docs_to_productos.items() if len(v) > 1]))
    print("Keys con múltiples UNs:", len([k for k, v in docs_to_uns.items() if len(v) > 1]))
except Exception as e:
    print(e)
