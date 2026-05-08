from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from datetime import datetime
import os

app = FastAPI(title="API Certificado de Ventas Internos - CEE ENRIQUEZ")

# Habilitar CORS para que el frontend React pueda consultar
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Credenciales de Aurora Data Warehouse (Finnegans BI)
DB_HOST = os.environ.get("DB_HOST", "infraestructura-aurora-datawarehouse-instance-zxhlvevffc1c.cijt7auhxunw.us-east-1.rds.amazonaws.com")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "finnegansbi")
DB_USER = os.environ.get("DB_USER", "ceesauser")
DB_PASS = os.environ.get("DB_PASS", "Lula$$2014")

# Supabase Credentials
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASS, sslmode="require"
    )

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "El backend responde correctamente"}

@app.get("/api/debug")
def debug_endpoint():
    conn = get_db_connection()
    cur = conn.cursor()
    # Ver todas las columnas del dataset
    cur.execute("SELECT * FROM ceesa_cee_certificados_ventas_internos LIMIT 1")
    all_cols = [desc[0] for desc in cur.description]
    cur.fetchall()
    # Contar filas totales y por comprobante
    cur.execute("SELECT numerodocumento, COUNT(*) as cnt, MAX(importe) as max_imp FROM ceesa_cee_certificados_ventas_internos GROUP BY numerodocumento ORDER BY numerodocumento")
    summary = [{"doc": r[0], "count": r[1], "max_importe": r[2]} for r in cur.fetchall()]
    cur.close()
    conn.close()
    return {"all_columns": all_cols, "comprobantes_summary": summary}

@app.get("/api/indicadores")
def get_indicadores():
    conn = None
    try:
        conn = get_db_connection()
        print("Conectado a Aurora. Consultando dataset de Finnegans...")
        
        query = "SELECT * FROM ceesa_cee_certificados_ventas_internos ORDER BY 1 DESC LIMIT 50000"
        
        # Ejecutar consulta directamente con psycopg2 para evitar dependencias de SQLAlchemy en Pandas
        cursor = conn.cursor()
        cursor.execute(query)
        columns_db = [desc[0] for desc in cursor.description]
        data_rows = cursor.fetchall()
        cursor.close()
        # 1. Convertir data_rows a diccionarios y deduplicar por operacionitemid
        # La vista de Finnegans devuelve múltiples filas por ítem debido a los cambios de estado (workflow)
        unique_items = {}
        states_priority = {'Autorizado': 4, 'Rechazado': 3, 'Anulado': 3, 'Pendiente': 2, 'Sin Estado': 1}
        
        for row in data_rows:
            record = dict(zip(columns_db, row))
            item_id = record.get('operacionitemid')
            
            # Si no hay operacionitemid, armamos una clave compuesta (transaccion + producto + importe)
            if not item_id or item_id == 'NULL':
                item_id = f"{record.get('transaccionid', '')}_{record.get('producto', '')}_{record.get('importe', '')}"
                
            new_state = record.get('estadoautorizacion', '')
            
            if item_id in unique_items:
                current_state = unique_items[item_id].get('estadoautorizacion', '')
                new_prio = states_priority.get(new_state, 0)
                curr_prio = states_priority.get(current_state, 0)
                
                if new_prio > curr_prio:
                    unique_items[item_id]['estadoautorizacion'] = new_state
            else:
                unique_items[item_id] = record
                
        records = list(unique_items.values())
            
        if not records:
            raise Exception("No data found en Aurora")
            
        print(f"Cargados {len(records)} ítems únicos desde Aurora (filtrando duplicados de workflow).")
        
        # 2. Mapeo de columnas para el Frontend
        column_mapping = {}
        mapped_targets = set()
        
        for col in columns_db:
            col_lower = col.lower()
            if 'fecha' in col_lower and 'Fecha' not in mapped_targets:
                column_mapping[col] = 'Fecha'
                mapped_targets.add('Fecha')
            elif col_lower in ['numerodocumento', 'comprobante', 'nrocomprobante'] and 'Comprobante' not in mapped_targets:
                column_mapping[col] = 'Comprobante'
                mapped_targets.add('Comprobante')
            elif 'empresa' in col_lower and 'Empresa' not in mapped_targets:
                column_mapping[col] = 'Empresa'
                mapped_targets.add('Empresa')
            elif 'organizacion' == col_lower and 'Unidad de Negocio' not in mapped_targets:
                column_mapping[col] = 'Unidad de Negocio'
                mapped_targets.add('Unidad de Negocio')
            elif 'sector' in col_lower and 'Sector' not in mapped_targets:
                column_mapping[col] = 'Sector'
                mapped_targets.add('Sector')
            elif col_lower in ['documentodescripcion', 'descripción', 'descripcion', 'detalledescripcion'] and 'Descripción' not in mapped_targets:
                column_mapping[col] = 'Descripción'
                mapped_targets.add('Descripción')
            elif 'gravado' in col_lower and 'Total Gravado' not in mapped_targets:
                column_mapping[col] = 'Total Gravado'
                mapped_targets.add('Total Gravado')
            elif ('importe' == col_lower or ('total' in col_lower and 'bruto' not in col_lower)) and 'Total Bruto' not in mapped_targets:
                column_mapping[col] = 'Total Bruto'
                mapped_targets.add('Total Bruto')
            elif 'estadoautorizacion' == col_lower and 'EstadoAutorizacion' not in mapped_targets:
                column_mapping[col] = 'EstadoAutorizacion'
                mapped_targets.add('EstadoAutorizacion')
            elif 'solicitante' == col_lower and 'Solicitante' not in mapped_targets:
                column_mapping[col] = 'Solicitante'
                mapped_targets.add('Solicitante')
                
        # Aplicar mapeo y formatear fechas/nulos
        for record in records:
            # Renombrar keys
            for old_col, new_col in column_mapping.items():
                if old_col in record:
                    record[new_col] = record.pop(old_col)
            
            # Duplicar Total Bruto a Total Gravado si este ultimo no existe (para los KPIs del frontend)
            if 'Total Bruto' in record and 'Total Gravado' not in record:
                record['Total Gravado'] = record['Total Bruto']
            
            # Limpiar nulos y formatear fechas
            for k, v in list(record.items()):
                if v == 'NULL' or v is None:
                    record[k] = ''
                elif isinstance(v, datetime):
                    record[k] = v.strftime('%d/%m/%Y')
                elif k == 'Fecha' and isinstance(v, str) and len(v) >= 10:
                    try:
                        record[k] = datetime.strptime(v[:10], '%Y-%m-%d').strftime('%d/%m/%Y')
                    except Exception:
                        pass
                    
        # Actualizar lista de columnas finales
        final_columns = list(records[0].keys()) if records else []
        
    except Exception as e:
        print(f"Error consultando BD. Usando Mock Data. Detalles: {e}")
        # Fallback a Mock Data si todo falla
        records = [
            {'Fecha': '01/05/2026', 'Comprobante': 'CVI-0001', 'Producto': 'Hormigón H21', 'Cantidad': 150.0, 'Importe': 1500000.0},
            {'Fecha': '02/05/2026', 'Comprobante': 'CVI-0002', 'Producto': 'Servicio IT', 'Cantidad': 1.0, 'Importe': 2500000.0}
        ]
        final_columns = list(records[0].keys())

    finally:
        if conn:
            conn.close()

    # 3. Calcular KPIs
    total_gravado = 0.0
    total_final = 0.0
    clientes_set = set()
    certificados_set = set()

    for record in records:
        # Encontrar columna gravado y total (ignorando mayusculas)
        val_gravado = 0
        val_total = 0
        for k, v in record.items():
            k_lower = k.lower()
            if 'gravado' in k_lower:
                try: val_gravado = float(v) if v != '' else 0.0
                except: pass
            if 'total' in k_lower and 'bruto' not in k_lower:
                try: val_total = float(v) if v != '' else 0.0
                except: pass
            if 'cliente' in k_lower and v != '':
                clientes_set.add(v)
            if ('documento' in k_lower or 'comprobante' in k_lower) and v != '':
                certificados_set.add(v)
                
        total_gravado += val_gravado
        total_final += val_total

    clientes_activos = len(clientes_set)
    total_certificados = len(certificados_set) if certificados_set else len(records)
    
    return {
        "kpis": {
            "total_certificados": total_certificados,
            "total_gravado": total_gravado,
            "total_final": total_final,
            "clientes_activos": clientes_activos
        },
        "columns": final_columns,
        "data": records
    }

if __name__ == "__main__":
    import uvicorn
    # Iniciar servidor local
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
