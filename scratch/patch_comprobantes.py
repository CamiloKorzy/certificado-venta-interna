import re

with open(r'c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend\main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the SELECT queries in /api/comprobantes
old_query_1 = 'SELECT tipo_movimiento, categoria, fecha_carga, concepto, observaciones, importe, unidad_negocio FROM cert_ajustes_excel WHERE periodo = %s'
new_query_1 = 'SELECT id, tipo_movimiento, categoria, fecha_carga, concepto, observaciones, importe, unidad_negocio FROM cert_ajustes_excel WHERE periodo = %s'

old_query_2 = 'SELECT tipo_movimiento, categoria, fecha_carga, concepto, observaciones, importe, unidad_negocio FROM cert_ajustes_excel WHERE unidad_negocio = %s AND periodo = %s'
new_query_2 = 'SELECT id, tipo_movimiento, categoria, fecha_carga, concepto, observaciones, importe, unidad_negocio FROM cert_ajustes_excel WHERE unidad_negocio = %s AND periodo = %s'

content = content.replace(old_query_1, new_query_1)
content = content.replace(old_query_2, new_query_2)

# Fix the dict creation
old_dict = """            item = {
                "origen": "AJUSTE EXCEL",
                "tipo_movimiento": "INGRESO" if r[0] == "INGRESO" else "EGRESO",
                "categoria": r[1] or "Ajuste Manual",
                "fecha": str(r[2]) if r[2] else None,
                "concepto": f"[{r[6]}] {r[3]}",
                "comprobante": r[4] or "-",
                "importe": float(r[5] or 0)
            }
            if r[0] == "INGRESO":"""

new_dict = """            item = {
                "origen": "AJUSTE EXCEL",
                "id_ajuste": r[0],
                "tipo_movimiento": "INGRESO" if r[1] == "INGRESO" else "EGRESO",
                "categoria": r[2] or "Ajuste Manual",
                "fecha": str(r[3]) if r[3] else None,
                "concepto": f"[{r[7]}] {r[4]}",
                "comprobante": r[5] or "-",
                "importe": float(r[6] or 0)
            }
            if r[1] == "INGRESO":"""

content = content.replace(old_dict, new_dict)

with open(r'c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend\main.py', 'w', encoding='utf-8') as f:
    f.write(content)
