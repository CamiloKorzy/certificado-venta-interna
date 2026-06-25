import re

with open(r'c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend\main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add logic to fetch Excel adjustments for Ingresos and append to records
ajustes_logic = """
        # --- PASO 2.5: Añadir Ajustes Excel (Ingresos) ---
        try:
            conn_supa = get_supabase()
            cur_supa = conn_supa.cursor()
            
            # Construir la query base
            query_ajustes = "SELECT id, tipo_movimiento, categoria, fecha_carga, concepto, observaciones, importe, unidad_negocio FROM cert_ajustes_excel WHERE tipo_movimiento = 'INGRESO'"
            params_ajustes = []
            
            if user.get("rol") != "admin" and unidades_permitidas:
                # Filtrar por unidades permitidas
                placeholders = ','.join(['%s'] * len(unidades_permitidas))
                query_ajustes += f" AND unidad_negocio IN ({placeholders})"
                params_ajustes.extend(list(unidades_permitidas))
            
            cur_supa.execute(query_ajustes, tuple(params_ajustes))
            rows_ajustes = cur_supa.fetchall()
            
            for r in rows_ajustes:
                id_ajuste = r[0]
                categoria = r[2] or "Ajuste Manual"
                fecha = str(r[3]) if r[3] else ""
                if fecha and len(fecha) >= 10:
                    try:
                        import datetime
                        fecha = datetime.datetime.strptime(fecha[:10], '%Y-%m-%d').strftime('%d/%m/%Y')
                    except:
                        pass
                concepto_str = f"[{r[7]}] {r[4]}"
                observaciones = r[5] or "-"
                importe_val = float(r[6] or 0)
                
                record_ajuste = {
                    'Fecha': fecha,
                    'Comprobante': f"EXCEL-{id_ajuste}",
                    'id_ajuste': id_ajuste,
                    'Empresa': r[7],  # unidad_negocio
                    'Cliente': '-',
                    'Descripción': observaciones,
                    'Solicitante': '-',
                    'EstadoAutorizacion': 'Ajuste',
                    'Total Bruto': str(importe_val),
                    'Neto Gravado': str(importe_val),
                    'IVA': '0.0',
                    'UnidadNegocio': r[7],
                    'Concepto': categoria,
                    'origen': 'AJUSTE EXCEL',
                    'items': [{
                        'id': f'item-{id_ajuste}',
                        'descripcion': observaciones,
                        'precio': importe_val,
                        'cantidad': 1,
                        'total': importe_val
                    }]
                }
                records.append(record_ajuste)
            
            cur_supa.close()
            conn_supa.close()
        except Exception as e:
            print(f"Error consultando Ajustes Excel en indicadores: {e}")

        if not records:
"""

content = content.replace("        if not records:", ajustes_logic)

with open(r'c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend\main.py', 'w', encoding='utf-8') as f:
    f.write(content)
