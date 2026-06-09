import sys
sys.path.append('.')
from main import get_indicadores

try:
    res = get_indicadores(user={"username": "test"})
    data = res.get('data', [])
    clientes = set()
    uns = set()
    productos = set()
    for row in data:
        c = row.get('Cliente')
        if c: clientes.add(c)
        u = row.get('Solicitante')
        if u: uns.add(u)
        p = row.get('Concepto')
        if p: productos.add(p)
        
    print("Clientes:", len(clientes), clientes)
    print("UNs:", len(uns), uns)
    print("Productos:", len(productos), productos)
except Exception as e:
    import traceback
    traceback.print_exc()
