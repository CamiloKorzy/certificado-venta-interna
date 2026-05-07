from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import pandas as pd
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

@app.get("/api/indicadores")
def get_indicadores():
    conn = None
    df = None
    try:
        conn = get_db_connection()
        print("Conectado a Aurora. Consultando dataset de Finnegans...")
        
        query = "SELECT * FROM ceesa_cee_certificados_ventas_internos"
        df = pd.read_sql(query, conn)
        
        if df is None or df.empty:
            raise Exception("No data found en Aurora")
            
        print(f"Cargados {len(df)} registros desde Aurora.")
        
        # Mapeo de columnas para asegurar compatibilidad con el Frontend (React)
        # El frontend espera: 'Fecha', 'Comprobante', 'Empresa' (Prestador), 'Unidad de Negocio', 'Sector', 
        # 'Descripción', 'Total Bruto', 'Total Gravado', 'EstadoAutorizacion', 'Solicitante'
        
        # Diccionario de mapeo tentativo (se ajusta dinámicamente si es necesario)
        column_mapping = {}
        for col in df.columns:
            col_lower = col.lower()
            if 'fecha' in col_lower and 'Fecha' not in df.columns:
                column_mapping[col] = 'Fecha'
            elif ('documento' in col_lower or 'comprobante' in col_lower) and 'Comprobante' not in df.columns:
                column_mapping[col] = 'Comprobante'
            elif 'empresa' in col_lower and 'Empresa' not in df.columns:
                column_mapping[col] = 'Empresa'
            elif 'unidad' in col_lower and 'negocio' in col_lower and 'Unidad de Negocio' not in df.columns:
                column_mapping[col] = 'Unidad de Negocio'
            elif 'sector' in col_lower and 'Sector' not in df.columns:
                column_mapping[col] = 'Sector'
            elif 'descripc' in col_lower and 'Descripción' not in df.columns:
                column_mapping[col] = 'Descripción'
            elif 'gravado' in col_lower and 'Total Gravado' not in df.columns:
                column_mapping[col] = 'Total Gravado'
            elif 'total' in col_lower and 'bruto' not in col_lower and 'Total Bruto' not in df.columns:
                column_mapping[col] = 'Total Bruto'
            elif 'estadoautorizacion' == col_lower and 'EstadoAutorizacion' not in df.columns:
                column_mapping[col] = 'EstadoAutorizacion'
            elif 'solicitante' == col_lower and 'Solicitante' not in df.columns:
                column_mapping[col] = 'Solicitante'
                
        if column_mapping:
            df = df.rename(columns=column_mapping)
            print(f"Columnas mapeadas: {column_mapping}")
            
    except Exception as e:
        print(f"Error consultando BD. Usando Mock Data. Detalles: {e}")
        # Fallback a Mock Data si todo falla
        data = {
            'Fecha': ['2026-05-01', '2026-05-02'],
            'Documento': ['CVI-0001', 'CVI-0002'],
            'Producto': ['Hormigón H21', 'Servicio IT'],
            'Cantidad': [150.0, 1.0],
            'Importe': [1500000.0, 2500000.0]
        }
        df = pd.DataFrame(data)

    finally:
        if conn:
            conn.close()

    # Formatear Fechas para JSON (ISO o string)
    for col in df.columns:
        if 'fecha' in col.lower() and pd.api.types.is_datetime64_any_dtype(df[col]):
            df[col] = df[col].dt.strftime('%d/%m/%Y')
            
    # Limpieza de nulos
    df = df.replace('NULL', None)
    df = df.fillna('')
    
    # Identificar columnas clave para KPIs basadas en Finnegans Excel
    col_gravado = next((c for c in df.columns if 'gravado' in c.lower()), None)
    col_total = next((c for c in df.columns if 'total' in c.lower() and 'bruto' not in c.lower()), None)
    col_cliente = next((c for c in df.columns if 'cliente' in c.lower()), None)
    col_doc = next((c for c in df.columns if 'documento' in c.lower() or 'comprobante' in c.lower()), None)
    
    # Asegurar tipo numérico para sumatorias
    if col_gravado: df['_num_gravado'] = pd.to_numeric(df[col_gravado], errors='coerce').fillna(0)
    if col_total: df['_num_total'] = pd.to_numeric(df[col_total], errors='coerce').fillna(0)
    
    total_gravado = float(df['_num_gravado'].sum()) if col_gravado else 0.0
    total_final = float(df['_num_total'].sum()) if col_total else 0.0
    
    clientes_activos = 0
    if col_cliente:
        clientes_activos = len([u for u in df[col_cliente].unique() if pd.notna(u) and str(u).strip() != ''])
        
    total_certificados = 0
    if col_doc:
        total_certificados = len([d for d in df[col_doc].unique() if pd.notna(d) and str(d).strip() != ''])
    else:
        total_certificados = len(df)

    # Limpiar columnas temporales de calculo
    if '_num_gravado' in df.columns: df = df.drop(columns=['_num_gravado'])
    if '_num_total' in df.columns: df = df.drop(columns=['_num_total'])

    return {
        "kpis": {
            "total_certificados": total_certificados,
            "total_gravado": total_gravado,
            "total_final": total_final,
            "clientes_activos": clientes_activos
        },
        "columns": list(df.columns),
        "data": df.to_dict(orient="records")
    }

if __name__ == "__main__":
    import uvicorn
    # Iniciar servidor local
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
