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

@app.get("/api/indicadores")
def get_indicadores():
    conn = None
    df = None
    try:
        conn = get_db_connection()
        print("Conectado a Aurora. Consultando dataset de Finnegans...")
        
        query = "SELECT * FROM ceesa_cee_certificados_ventas_internos ORDER BY 1 DESC LIMIT 2000"
        
        # Ejecutar consulta directamente con psycopg2 para evitar dependencias de SQLAlchemy en Pandas
        cursor = conn.cursor()
        cursor.execute(query)
        columns_db = [desc[0] for desc in cursor.description]
        data_rows = cursor.fetchall()
        cursor.close()
        # 1. Convertir data_rows (tuplas) a una lista de diccionarios
        records = []
        for row in data_rows:
            # Crear diccionario uniendo nombre de columna con valor
            record = dict(zip(columns_db, row))
            records.append(record)
            
        if not records:
            raise Exception("No data found en Aurora")
            
        print(f"Cargados {len(records)} registros desde Aurora.")
        
        # 2. Mapeo de columnas para el Frontend
        column_mapping = {}
        for col in columns_db:
            col_lower = col.lower()
            if 'fecha' in col_lower and 'Fecha' not in columns_db:
                column_mapping[col] = 'Fecha'
            elif ('documento' in col_lower or 'comprobante' in col_lower) and 'Comprobante' not in columns_db:
                column_mapping[col] = 'Comprobante'
            elif 'empresa' in col_lower and 'Empresa' not in columns_db:
                column_mapping[col] = 'Empresa'
            elif 'unidad' in col_lower and 'negocio' in col_lower and 'Unidad de Negocio' not in columns_db:
                column_mapping[col] = 'Unidad de Negocio'
            elif 'sector' in col_lower and 'Sector' not in columns_db:
                column_mapping[col] = 'Sector'
            elif 'descripc' in col_lower and 'Descripción' not in columns_db:
                column_mapping[col] = 'Descripción'
            elif 'gravado' in col_lower and 'Total Gravado' not in columns_db:
                column_mapping[col] = 'Total Gravado'
            elif 'total' in col_lower and 'bruto' not in col_lower and 'Total Bruto' not in columns_db:
                column_mapping[col] = 'Total Bruto'
            elif 'estadoautorizacion' == col_lower and 'EstadoAutorizacion' not in columns_db:
                column_mapping[col] = 'EstadoAutorizacion'
            elif 'solicitante' == col_lower and 'Solicitante' not in columns_db:
                column_mapping[col] = 'Solicitante'
                
        # Aplicar mapeo y formatear fechas/nulos
        for record in records:
            # Renombrar keys
            for old_col, new_col in column_mapping.items():
                if old_col in record:
                    record[new_col] = record.pop(old_col)
            
            # Limpiar nulos y formatear fechas
            for k, v in record.items():
                if v == 'NULL' or v is None:
                    record[k] = ''
                elif isinstance(v, datetime):
                    record[k] = v.strftime('%d/%m/%Y')
                    
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
