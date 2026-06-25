import psycopg2
import pandas as pd
import os

DB_HOST = "infraestructura-aurora-datawarehouse-instance-zxhlvevffc1c.cijt7auhxunw.us-east-1.rds.amazonaws.com"
DB_PORT = "5432"
DB_NAME = "finnegansbi"
DB_USER = "ceesauser"
DB_PASS = "Lula$$2014"

def run_export():
    print("Connecting to Aurora PostgreSQL...")
    conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASS, sslmode="require")
    
    # Define query date range
    start_date = '2026-06-14'
    end_date = '2026-06-21'
    
    # 1. Query ceesa_cee_equipos_trabajos_realizados
    print("Querying ceesa_cee_equipos_trabajos_realizados...")
    query_trabajos = f"""
        SELECT 
            maquina AS "Máquina/Equipo",
            codigomaquina AS "Código Máquina",
            fecha AS "Fecha",
            documento AS "Documento",
            comprobante AS "Comprobante",
            horastrabajadas AS "Horas Trabajadas",
            horometroinicio AS "Horómetro Inicio",
            horometrofin AS "Horómetro Fin",
            horashorometro AS "Horas Horómetro",
            descripciontrabajo AS "Descripción Trabajo",
            centrodecosto AS "Centro de Costo",
            maquinista AS "Maquinista/Operador",
            capataz AS "Capataz/Supervisor",
            tipoesfuerzo AS "Tipo Esfuerzo",
            combustible AS "Combustible (L)",
            cantidadaceite AS "Aceite (L)",
            causadeparo AS "Causa de Paro",
            horasparo AS "Horas de Paro",
            empresa AS "Empresa/Obra",
            base AS "Base"
        FROM ceesa_cee_equipos_trabajos_realizados
        WHERE CAST(fecha AS TIMESTAMP) >= '{start_date}'
          AND CAST(fecha AS TIMESTAMP) <= '{end_date}'
        ORDER BY fecha ASC, maquina ASC
    """
    df_trabajos = pd.read_sql_query(query_trabajos, conn)
    print(f"Retrieved {len(df_trabajos)} rows for Trabajos Realizados.")
    
    # 2. Query ceesa_cee_consumo_combutible_maquinas
    print("Querying ceesa_cee_consumo_combutible_maquinas...")
    query_combustible = f"""
        SELECT 
            fecha AS "Fecha",
            comprobante AS "Comprobante",
            tipodocumento AS "Tipo Documento",
            codigotipodocumento AS "Cód. Tipo Doc.",
            maquina AS "Máquina/Equipo",
            codigomaquina AS "Código Máquina",
            consumoestandarmaquina AS "Consumo Estándar",
            cantidadcombustible AS "Cantidad Combustible (L)",
            horastrabajadas AS "Horas Trabajadas",
            horometromanual AS "Horómetro Manual",
            consumopromedioporhora AS "Consumo Promedio/Hora",
            producto AS "Producto/Combustible",
            codigoproducto AS "Código Producto",
            cantidadproducto AS "Cantidad Producto",
            unidad AS "Unidad de Medida",
            depositoorigen AS "Depósito Origen",
            consumoevento AS "Consumo Evento",
            consumopromedioevento AS "Consumo Promedio Evento",
            horometroevento AS "Horómetro Evento",
            horometroacumuladoevento AS "Horómetro Acumulado Evento",
            empresa AS "Empresa/Obra",
            base AS "Base"
        FROM ceesa_cee_consumo_combutible_maquinas
        WHERE CAST(fecha AS TIMESTAMP) >= '{start_date}'
          AND CAST(fecha AS TIMESTAMP) <= '{end_date}'
        ORDER BY fecha ASC, maquina ASC
    """
    df_combustible = pd.read_sql_query(query_combustible, conn)
    print(f"Retrieved {len(df_combustible)} rows for Consumo Combustible.")
    
    # 3. Query ceesa_cee_certificados_ventas_internas
    print("Querying ceesa_cee_certificados_ventas_internas...")
    query_certificados = f"""
        SELECT 
            fecha AS "Fecha",
            documento AS "Documento",
            comprobante AS "Comprobante",
            cliente AS "Cliente",
            descripcion AS "Descripción",
            gravado AS "Gravado",
            otros AS "Otros",
            total AS "Total",
            moneda AS "Moneda",
            empresa AS "Empresa",
            fechaalta AS "Fecha Alta",
            nombreusuarioalta AS "Usuario Alta",
            condicionpagonombre AS "Condición Pago",
            equiposolicitantenombre AS "Equipo Solicitante",
            itemtipo AS "Tipo Item",
            itemdescripcion AS "Descripción Item",
            itemcantidad AS "Cantidad Item",
            itemprecio AS "Precio Item",
            itemimporte AS "Importe Item",
            productonombre AS "Producto/Equipo",
            conceptonombre AS "Concepto Nombre",
            base AS "Base"
        FROM ceesa_cee_certificados_ventas_internas
        WHERE CAST(fecha AS TIMESTAMP) >= '{start_date}'
          AND CAST(fecha AS TIMESTAMP) <= '{end_date}'
        ORDER BY fecha ASC
    """
    df_certificados = pd.read_sql_query(query_certificados, conn)
    print(f"Retrieved {len(df_certificados)} rows for Certificados de Ventas Internas.")
    
    conn.close()
    
    # Paths to save
    local_path = r"c:\Datos\Proyectos IT\Certificado_Venta_Interna\Equipos_Ultima_Semana.xlsx"
    artifact_dir = r"C:\Users\Usuario\.gemini\antigravity\brain\b7147187-79e9-4819-aa74-c15ba564d3f0"
    artifact_path = os.path.join(artifact_dir, "Equipos_Ultima_Semana.xlsx")
    
    # Write to Excel
    for path in [local_path, artifact_path]:
        print(f"Writing to Excel at: {path}")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with pd.ExcelWriter(path, engine='openpyxl') as writer:
            # Trabajos
            df_trabajos.to_excel(writer, sheet_name="Trabajos Realizados", index=False)
            
            # Combustible
            df_combustible.to_excel(writer, sheet_name="Consumo Combustible", index=False)
            
            # Certificados (write header even if empty)
            if df_certificados.empty:
                # Add a dummy row to explain
                dummy_df = pd.DataFrame([{col: "No hay registros para este rango en este dataset" for col in df_certificados.columns}])
                dummy_df.to_excel(writer, sheet_name="Certificados Ventas", index=False)
            else:
                df_certificados.to_excel(writer, sheet_name="Certificados Ventas", index=False)
                
            # Auto-adjust column widths
            for sheet_name in writer.sheets:
                worksheet = writer.sheets[sheet_name]
                for col in worksheet.columns:
                    max_len = 0
                    col_letter = col[0].column_letter
                    for cell in col:
                        if cell.value:
                            val_str = str(cell.value)
                            if len(val_str) > max_len:
                                max_len = len(val_str)
                    worksheet.column_dimensions[col_letter].width = max(max_len + 3, 12)
                    
    print("Export completed successfully!")

if __name__ == '__main__':
    run_export()
