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
    # Ver estructura de importes para un comprobante conocido (CI-0001-00000023 = total 447700)
    cur.execute("""
        SELECT DISTINCT numerodocumento, importe, producto, detalledescripcion, precio, cantidadworkflow
        FROM ceesa_cee_certificados_ventas_internos 
        WHERE numerodocumento = 'CI-0001-00000003'
        ORDER BY CAST(NULLIF(importe,'0') AS DECIMAL) DESC NULLS LAST
    """)
    cols = [desc[0] for desc in cur.description]
    rows = [dict(zip(cols, r)) for r in cur.fetchall()]
    cur.close()
    conn.close()
    return {"sample_rows": rows}

@app.get("/api/indicadores")
def get_indicadores():
    conn = None
    try:
        conn = get_db_connection()
        print("Conectado a Aurora. Consultando dataset de Finnegans...")
        
        query = "SELECT * FROM ceesa_cee_certificados_ventas_internos ORDER BY 1 DESC LIMIT 50000"
        
        cursor = conn.cursor()
        cursor.execute(query)
        columns_db = [desc[0] for desc in cursor.description]
        data_rows = cursor.fetchall()
        cursor.close()
        
        print(f"Filas crudas del dataset: {len(data_rows)}")
        
        # ─── PASO 1: Agrupar por numerodocumento ───
        # La vista de Finnegans devuelve N filas por comprobante:
        #   - Filas de cabecera (sin producto, importe = total del comprobante)
        #   - Filas de subtotales (sin producto, importe = gravado, otros)
        #   - Filas de ítems (con producto, importe = monto del ítem)
        #   - Cada una multiplicada por ~10 estados de workflow
        # Solución: MAX(importe numérico) = total cabecera, estado de mayor prioridad
        
        states_priority = {'Autorizado': 4, 'Rechazado': 3, 'Anulado': 3, 'Pendiente': 2, 'Sin Estado': 1, '': 0}
        
        comprobantes = {}
        for row in data_rows:
            record = dict(zip(columns_db, row))
            num_doc = record.get('numerodocumento', '')
            if not num_doc or num_doc == 'NULL':
                continue
                
            # Parsear importe como número
            imp_raw = record.get('importe', '0') or '0'
            try:
                imp = float(str(imp_raw).replace(',', '.'))
            except:
                imp = 0.0
            
            state = str(record.get('estadoautorizacion', '') or '').strip()
            producto = str(record.get('producto', '') or '').strip()
            
            if num_doc not in comprobantes:
                comprobantes[num_doc] = {
                    'metadata': record,
                    'max_importe': imp,
                    'best_state': state,
                    'items': {},
                    'distinct_importes': set(),  # Para identificar Gravado vs IVA vs Total
                }
            
            # Actualizar MAX importe (total cabecera)
            if imp > comprobantes[num_doc]['max_importe']:
                comprobantes[num_doc]['max_importe'] = imp
            
            # Recoger importes distintos (para descomponer Gravado/IVA/Total)
            if imp > 0:
                comprobantes[num_doc]['distinct_importes'].add(round(imp, 2))
            
            # Actualizar mejor estado
            if states_priority.get(state, 0) > states_priority.get(comprobantes[num_doc]['best_state'], 0):
                comprobantes[num_doc]['best_state'] = state
            
            # Recoger ítems únicos (filas con producto)
            if producto and producto != 'NULL':
                if producto not in comprobantes[num_doc]['items']:
                    # Parsear cantidad y precio del ítem
                    cant_raw = record.get('cantidadworkflow', '0') or '0'
                    precio_raw = record.get('precio', '0') or '0'
                    try:
                        cant = float(str(cant_raw).replace(',', '.'))
                    except:
                        cant = 1.0
                    try:
                        precio = float(str(precio_raw).replace(',', '.'))
                    except:
                        precio = 0.0
                    
                    comprobantes[num_doc]['items'][producto] = {
                        'Producto': producto,
                        'Cantidad': cant,
                        'Precio': precio,
                        'Importe': imp,
                        'Unidad': record.get('unidad', '')
                    }
        
        print(f"Comprobantes únicos encontrados: {len(comprobantes)}")
        
        # ─── PASO 2: Construir registros finales ───
        records = []
        for num_doc, data in comprobantes.items():
            meta = data['metadata']
            
            # Formatear fecha
            fecha_raw = meta.get('fecha', '')
            fecha_fmt = ''
            if fecha_raw:
                try:
                    if isinstance(fecha_raw, datetime):
                        fecha_fmt = fecha_raw.strftime('%d/%m/%Y')
                    elif isinstance(fecha_raw, str) and len(fecha_raw) >= 10:
                        fecha_fmt = datetime.strptime(fecha_raw[:10], '%Y-%m-%d').strftime('%d/%m/%Y')
                    else:
                        fecha_fmt = str(fecha_raw)
                except:
                    fecha_fmt = str(fecha_raw)
            
            # Limpiar campos nulos
            def clean(val):
                if val is None or val == 'NULL':
                    return ''
                return str(val).strip()
            
            # Descripción del certificado
            desc = clean(meta.get('documentodescripcion', ''))
            if not desc:
                desc = clean(meta.get('detalledescripcion', ''))
            
            # Construir ítems para la vista expandible
            items_list = list(data['items'].values())
            
            # Calcular Gravado e IVA a partir del Total
            # Total = Gravado + IVA = Gravado × 1.21
            total_val = data['max_importe']
            gravado_val = round(total_val / 1.21, 2)
            iva_val = round(total_val - gravado_val, 2)
            
            record = {
                'Fecha': fecha_fmt,
                'Comprobante': num_doc,
                'Empresa': clean(meta.get('empresa', '')),
                'Descripción': desc,
                'Solicitante': clean(meta.get('solicitante', '')),
                'EstadoAutorizacion': data['best_state'] if data['best_state'] else 'Sin Estado',
                'Total Bruto': str(total_val),
                'Neto Gravado': str(gravado_val),
                'IVA': str(iva_val),
                'items': items_list,
            }
            records.append(record)
        
        if not records:
            raise Exception("No data found en Aurora")
            
        final_columns = ['Fecha', 'Comprobante', 'Empresa', 'Descripción', 'Solicitante', 'EstadoAutorizacion', 'Neto Gravado', 'IVA', 'Total Bruto']
        
    except Exception as e:
        print(f"Error consultando BD. Usando Mock Data. Detalles: {e}")
        records = [
            {'Fecha': '01/05/2026', 'Comprobante': 'CVI-0001', 'Descripción': 'Mock', 'Empresa': 'CEE', 'Total Bruto': '0', 'Total Gravado': '0', 'EstadoAutorizacion': 'Sin Estado', 'Solicitante': '', 'items': []}
        ]
        final_columns = list(records[0].keys())

    finally:
        if conn:
            conn.close()

    # ─── PASO 3: Calcular KPIs en base a registros ya agregados ───
    sum_neto_gravado = 0.0
    sum_iva = 0.0
    sum_total = 0.0
    clientes_set = set()
    
    for record in records:
        try:
            sum_total += float(record.get('Total Bruto', '0') or '0')
            sum_neto_gravado += float(record.get('Neto Gravado', '0') or '0')
            sum_iva += float(record.get('IVA', '0') or '0')
        except:
            pass
        
        empresa = record.get('Empresa', '')
        if empresa:
            clientes_set.add(empresa)
    
    return {
        "kpis": {
            "total_certificados": len(records),
            "neto_gravado": sum_neto_gravado,
            "iva": sum_iva,
            "total_final": sum_total,
            "clientes_activos": len(clientes_set)
        },
        "columns": final_columns,
        "data": records
    }

if __name__ == "__main__":
    import uvicorn
    # Iniciar servidor local
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
