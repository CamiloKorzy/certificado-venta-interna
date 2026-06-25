import re

with open(r'c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend\main.py', 'r', encoding='utf-8') as f:
    content = f.read()

target = """query_ajustes = "SELECT id, tipo_movimiento, categoria, fecha_carga, concepto, observaciones, importe, unidad_negocio FROM cert_ajustes_excel WHERE tipo_movimiento = 'INGRESO'\""""
new_target = """query_ajustes = "SELECT id, tipo_movimiento, categoria, fecha_carga, concepto, observaciones, importe, unidad_negocio, periodo FROM cert_ajustes_excel WHERE tipo_movimiento = 'INGRESO'\""""

content = content.replace(target, new_target)

target_loop = """            for r in rows_ajustes:
                id_ajuste = r[0]
                categoria = r[2] or "Ajuste Manual"
                fecha = str(r[3]) if r[3] else ""
                if fecha and len(fecha) >= 10:
                    try:
                        import datetime
                        fecha = datetime.datetime.strptime(fecha[:10], '%Y-%m-%d').strftime('%d/%m/%Y')
                    except:
                        pass
                concepto_str = f"[{r[7]}] {r[4]}\"
                observaciones = r[5] or "-"
                importe_val = float(r[6] or 0)"""

new_target_loop = """            for r in rows_ajustes:
                id_ajuste = r[0]
                categoria = r[2] or "Ajuste Manual"
                periodo_val = str(r[8] or "")
                
                # Use the first day of the periodo so the frontend extracts the correct period
                if periodo_val and "/" in periodo_val:
                    fecha = f"01/{periodo_val}"
                else:
                    fecha = str(r[3]) if r[3] else ""
                    if fecha and len(fecha) >= 10:
                        try:
                            import datetime
                            fecha = datetime.datetime.strptime(fecha[:10], '%Y-%m-%d').strftime('%d/%m/%Y')
                        except:
                            pass
                            
                concepto_str = f"[{r[7]}] {r[4]}\"
                observaciones = r[5] or "-"
                importe_val = float(r[6] or 0)"""

content = content.replace(target_loop, new_target_loop)

with open(r'c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend\main.py', 'w', encoding='utf-8') as f:
    f.write(content)
