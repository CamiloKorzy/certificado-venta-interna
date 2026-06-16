import re

def update_main_rrhh():
    with open('backend/main.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find get_rrhh
    start_idx = content.find('def get_rrhh(')
    end_idx = content.find('def get_gastos(', start_idx)
    
    rrhh_code = content[start_idx:end_idx]
    
    # We will completely replace the get_rrhh function with the new logic
    new_rrhh_code = """def get_rrhh(
    empresa: Optional[str] = None,
    periodo: Optional[str] = None
):
    try:
        empty_response = {
            "legajos": [],
            "totales": {
                "remunerativo": 0.0,
                "no_remunerativo": 0.0,
                "contribuciones": 0.0,
                "retenciones": 0.0,
                "sac_prorrateado": 0.0,
                "costo_empresa": 0.0,
                "neto": 0.0
            }
        }
        
        if not empresa or not periodo:
            return empty_response
            
        # El periodo viene como 'YYYY-MM', para RRHH lo pasamos a 'YYYYMM'
        periodo_str = periodo.replace("-", "")
        year_str, month_str = periodo.split('-')
        is_aguinaldo = month_str in ('06', '12')
        semestre = f"{year_str}-S1" if int(month_str) <= 6 else f"{year_str}-S2"

        conn_supa = get_supabase()
        cur_supa = conn_supa.cursor()
        
        # Obtener los centros de costo configurados para esta Sucursal
        cur_supa.execute("SELECT nombre FROM cert_config_centros_costo WHERE sucursal = %s", (empresa,))
        centros_rows = cur_supa.fetchall()
        
        centros_costo = [r[0] for r in centros_rows]
        if not centros_costo:
            cur_supa.close()
            conn_supa.close()
            return empty_response

        # Obtener provisiones de SAC de Supabase para este semestre (hasta el mes anterior)
        # Si es Junio, restamos lo acumulado de Ene a May. Si es Dic, de Jul a Nov.
        provisiones_por_legajo = {}
        # NOTA: Simplificaremos obteniendo la suma total de provisiones guardada para la unidad de negocio
        # en este semestre, o mejor dicho, la provisión fue guardada a nivel de "Unidad de Negocio" mes a mes.
        
        cur_supa.execute(\"\"\"
            SELECT SUM(monto_provision) 
            FROM cert_rrhh_provisiones_sac 
            WHERE unidad_negocio = %s AND semestre = %s AND periodo != %s
        \"\"\", (empresa, semestre, periodo))
        row_prov = cur_supa.fetchone()
        suma_provisiones_semestre = float(row_prov[0] or 0) if row_prov else 0.0

        cur_supa.close()
        conn_supa.close()

        conn = get_aurora()
        cur = conn.cursor()

        # Obtener la empresa padre para filtrar la liquidacion
        cur.execute(\"\"\"
            SELECT MAX(TRIM(COALESCE(nombreempresapadre, '')))
            FROM ceesa_cee_sucursales
            WHERE TRIM(COALESCE(nombreempresa, '')) = %s
        \"\"\", (empresa,))
        padre_row = cur.fetchone()
        empresa_padre = padre_row[0] if padre_row and padre_row[0] else empresa

        # Agrupamos por legajo, apellidonombre, centrocosto, tipoconcepto y nombreconcepto
        sql = \"\"\"
        WITH distinct_rows AS (
            SELECT DISTINCT
                transaccionid,
                legajo,
                apellidonombre,
                centrocosto,
                tipoconcepto,
                codigoconcepto,
                nombreconcepto,
                CAST(REPLACE(importe, ',', '.') AS NUMERIC) as importe
            FROM ceesa_cee_liquidaciones_de_sueldos_
            WHERE periodo = %s
              AND centrocosto IN %s
              AND TRIM(COALESCE(empresa, '')) = %s
        )
        SELECT
            legajo,
            apellidonombre,
            centrocosto,
            tipoconcepto,
            nombreconcepto,
            SUM(importe) as importe
        FROM distinct_rows
        GROUP BY
            legajo, apellidonombre, centrocosto, tipoconcepto, nombreconcepto
        \"\"\"
        
        cur.execute(sql, (periodo_str, tuple(centros_costo), empresa_padre))
        cols = [desc[0].lower() for desc in cur.description]
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        legajos_map = {}
        totales = {
            "remunerativo": 0.0,
            "no_remunerativo": 0.0,
            "contribuciones": 0.0,
            "retenciones": 0.0,
            "sac_prorrateado": 0.0,
            "sac_real": 0.0
        }
        
        for row in rows:
            record = dict(zip(cols, row))
            leg = record['legajo']
            if leg not in legajos_map:
                legajos_map[leg] = {
                    "legajo": leg,
                    "apellidonombre": record['apellidonombre'],
                    "centrocosto": record['centrocosto'],
                    "remunerativo": 0.0,
                    "no_remunerativo": 0.0,
                    "contribuciones": 0.0,
                    "retenciones": 0.0,
                    "sac_prorrateado": 0.0,
                    "sac_real": 0.0
                }
                
            tipo = str(record['tipoconcepto']).strip()
            nombre = str(record['nombreconcepto']).strip().upper()
            imp = float(record['importe'])
            
            es_sac = ('SAC' in nombre or 'AGUINALDO' in nombre)
            
            if es_sac:
                legajos_map[leg]['sac_real'] += imp
                totales['sac_real'] += imp
            elif tipo in ('Remunerativo', 'Remunerativo Variable'):
                legajos_map[leg]['remunerativo'] += imp
                totales['remunerativo'] += imp
            elif tipo == 'No Remunerativo':
                legajos_map[leg]['no_remunerativo'] += imp
                totales['no_remunerativo'] += imp
            elif tipo == 'Contribución Patronal' or tipo == 'Contribucion Patronal' or tipo == 'Contribucin Patronal' or 'Contrib' in tipo:
                legajos_map[leg]['contribuciones'] += imp
                totales['contribuciones'] += imp
            elif tipo == 'Retención' or tipo == 'Retencion' or tipo == 'Retencin' or 'Retenc' in tipo:
                legajos_map[leg]['retenciones'] += imp
                totales['retenciones'] += imp

        # Computar Costo Empresa y Neto
        resultado_legajos = []
        total_sac_prorrateado_mes = 0.0

        for leg in legajos_map.values():
            rem = leg['remunerativo']
            no_rem = leg['no_remunerativo']
            cont = leg['contribuciones']
            ret = abs(leg['retenciones'])
            sac_real = leg['sac_real']
            
            if is_aguinaldo:
                # En meses de SAC (Jun/Dic), no hay prorrateo para costo, el costo incluye el sac_real
                # PERO al SAC Real hay que descontarle las provisiones acumuladas de ese legajo!
                # Como guardamos la provision por Unidad de Negocio y no por legajo (porque era más sencillo en el plan original),
                # lo aplicaremos como un ajuste global en los totales, o lo dividiremos proporcionalmente.
                # Para simplificar, guardamos el SAC prorrateado en 'sac_prorrateado' como el SAC Real de este mes 
                # (el ajuste global lo haremos despues sobre los totales, o dividiremos suma_provisiones_semestre entre los legajos).
                # Mejor aún: el informe muestra los legajos. El prorrateo de SAC de meses anteriores no afecta el 'Neto' que cobra el empleado.
                # Afecta el COSTO EMPRESA.
                # Costo Empresa Mes = Remunerativo + No Remunerativo + Contribuciones + SAC Real - Provisiones Aplicadas
                leg['sac_prorrateado'] = 0.0
                leg['retenciones'] = ret
                leg['costo_empresa'] = rem + no_rem + cont + sac_real
                leg['neto'] = rem + no_rem + sac_real - ret
            else:
                # Meses no SAC: se provisiona 8.33% de remunerativo + contribuciones
                sac_prorr = (rem / 12.0) + (cont / 12.0)
                leg['sac_prorrateado'] = sac_prorr
                total_sac_prorrateado_mes += sac_prorr
                
                leg['retenciones'] = ret
                leg['costo_empresa'] = rem + no_rem + cont + sac_prorr
                leg['neto'] = rem + no_rem - ret
                
            resultado_legajos.append(leg)

        totales['retenciones'] = abs(totales['retenciones'])
        
        if is_aguinaldo:
            # Descontar la provisión acumulada del SAC real en los totales
            sac_ajustado = totales['sac_real'] - suma_provisiones_semestre
            totales['sac_prorrateado'] = sac_ajustado  # Lo mostramos en la columna sac_prorrateado para el dashboard
            totales['costo_empresa'] = totales['remunerativo'] + totales['no_remunerativo'] + totales['contribuciones'] + sac_ajustado
            # El neto que cobra el empleado sí incluye el SAC Real completo
            totales['neto'] = totales['remunerativo'] + totales['no_remunerativo'] + totales['sac_real'] - totales['retenciones']
        else:
            totales['sac_prorrateado'] = total_sac_prorrateado_mes
            totales['costo_empresa'] = totales['remunerativo'] + totales['no_remunerativo'] + totales['contribuciones'] + totales['sac_prorrateado']
            totales['neto'] = totales['remunerativo'] + totales['no_remunerativo'] - totales['retenciones']
            
            # Guardar provisión mensual en Supabase
            conn_s = get_supabase()
            cur_s = conn_s.cursor()
            cur_s.execute(\"\"\"
                INSERT INTO cert_rrhh_provisiones_sac (unidad_negocio, periodo, semestre, monto_provision)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (unidad_negocio, periodo) 
                DO UPDATE SET monto_provision = EXCLUDED.monto_provision
            \"\"\", (empresa, periodo, semestre, total_sac_prorrateado_mes))
            conn_s.commit()
            cur_s.close()
            conn_s.close()

        return {
            "totales": totales,
            "legajos": resultado_legajos
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
"""

    content = content.replace(rrhh_code, new_rrhh_code)
    
    with open('backend/main.py', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    update_main_rrhh()
