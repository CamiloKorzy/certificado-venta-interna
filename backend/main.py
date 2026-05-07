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
        # 1. Intentar leer desde el Excel proporcionado con el Detalle
        excel_path = r"C:\Datos\Proyectos IT\Certificado_Venta_Interna\Documentos\Detalle de Certificados de Ventas Generados.xlsx"
        excel_path_fallback = r"C:\Datos\Proyectos IT\Certificado_Venta_Interna\Documentos\Certificados de Ventas Generados.xlsx"
        
        if os.path.exists(excel_path):
            df = pd.read_excel(excel_path)
            print("Datos cargados exitosamente desde Excel Detalle.")
        elif os.path.exists(excel_path_fallback):
            df = pd.read_excel(excel_path_fallback)
            print("Datos cargados desde Excel (Fallback).")
        elif SUPABASE_URL and SUPABASE_KEY:
            # Fallback a Supabase si no hay Excel local (ej: Entorno Vercel)
            from supabase import create_client, Client
            supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
            response = supabase.table('certificados_detalle').select('*').execute()
            if response.data:
                df = pd.DataFrame(response.data)
                print("Datos cargados desde Supabase.")
            else:
                print("Tabla en Supabase vacía o sin datos.")
            
        conn = get_db_connection()
        if df is not None and not df.empty:
            if 'Comprobante' in df.columns:
                # We have the excel, let's enrich it with estadoautorizacion from DB
                try:
                    db_df = pd.read_sql("SELECT numerodocumento, estadoautorizacion, solicitante FROM ceesa_cee_certificados_ventas_internos", conn)
                    
                    # Prioritize 'Autorizado' rows over 'Pendiente' / others when grouping by numerodocumento
                    db_df['is_auth'] = db_df['estadoautorizacion'].astype(str).str.lower().str.contains('autorizado|aprobado', na=False)
                    db_df = db_df.sort_values(by=['numerodocumento', 'is_auth'], ascending=[True, False])
                    db_df = db_df.drop_duplicates(subset=['numerodocumento'], keep='first')
                    
                    df['Comprobante_clean'] = df['Comprobante'].astype(str).str.strip()
                    db_df['numerodocumento_clean'] = db_df['numerodocumento'].astype(str).str.strip()
                    
                    # Merge
                    merged = pd.merge(df, db_df, left_on='Comprobante_clean', right_on='numerodocumento_clean', how='left')
                    
                    # Replace EstadoAutorizacion
                    df['EstadoAutorizacion'] = merged['estadoautorizacion']
                    df['Solicitante'] = merged['solicitante']
                    
                    df.drop(columns=['Comprobante_clean'], inplace=True)
                    print("Enriched Excel data with DB estadoautorizacion and solicitante.")
                except Exception as e:
                    print(f"Error enriching data from DB: {e}")
            else:
                print("No 'Comprobante' column found, skipping DB enrichment.")
        else:
            # 2. Fallback a Base de Datos si no existe el Excel
            queries_to_try = [
                "SELECT * FROM ceesa_cee_certificados_ventas_internos LIMIT 1000",
                "SELECT * FROM CEE_Certificados_Ventas_Internos LIMIT 1000"
            ]
            for q in queries_to_try:
                try:
                    df = pd.read_sql(q, conn)
                    if 'estadoautorizacion' in df.columns:
                        df['EstadoAutorizacion'] = df['estadoautorizacion']
                    if 'solicitante' in df.columns:
                        df['Solicitante'] = df['solicitante']
                    break
                except Exception as ex:
                    conn.rollback()
                    continue
                    
        if df is None or df.empty:
            raise Exception("No data found")
            
    except Exception as e:
        print(f"Error cargando Excel o BD. Usando Mock Data. Detalles: {e}")
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
