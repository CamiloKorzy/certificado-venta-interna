import sys

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

target = """            if producto and producto != 'NULL':
                if producto not in comprobantes[num_doc]['items']:
                    cant_raw = record.get('itemcantidad', '0') or '0'
                    precio_raw = record.get('itemprecio', '0') or '0'
                    itemimp_raw = record.get('itemimporte', '0') or '0'
                    try:
                        cant = float(str(cant_raw).replace(',', '.'))
                    except:
                        cant = 1.0
                    try:
                        precio = float(str(precio_raw).replace(',', '.'))
                    except:
                        precio = 0.0
                    try:
                        itemimp = float(str(itemimp_raw).replace(',', '.'))
                    except:
                        itemimp = 0.0
                        
                    try:
                        comprobantes[num_doc]['items'][producto] = {
                            "producto": producto,
                            "cantidad": cant,
                            "precio": precio,
                            "importe": itemimp,
                            "unidad": str(record.get('itemunidad', '') or '').strip()
                        }
                    except: pass"""

replacement = """            if producto and producto != 'NULL':
                cant_raw = record.get('itemcantidad', '0') or '0'
                precio_raw = record.get('itemprecio', '0') or '0'
                itemimp_raw = record.get('itemimporte', '0') or '0'
                try:
                    cant = float(str(cant_raw).replace(',', '.'))
                except:
                    cant = 1.0
                try:
                    precio = float(str(precio_raw).replace(',', '.'))
                except:
                    precio = 0.0
                try:
                    itemimp = float(str(itemimp_raw).replace(',', '.'))
                except:
                    itemimp = 0.0

                try:
                    comprobantes[num_doc]['items'].append({
                        "producto": producto,
                        "cantidad": cant,
                        "precio": precio,
                        "importe": itemimp,
                        "unidad": str(record.get('itemunidad', '') or '').strip()
                    })
                except: pass"""

if target in content:
    content = content.replace(target, replacement)
    with open('backend/main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Target not found. Let's try searching for a shorter snippet.")
