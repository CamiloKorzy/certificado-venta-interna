import os
import pandas as pd
from supabase import create_client, Client
import math

# Configurar estas variables o pasarlas por entorno
SUPABASE_URL = os.environ.get("SUPABASE_URL", "TU_URL_AQUI")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "TU_KEY_AQUI")

EXCEL_PATH = r"C:\Datos\Proyectos IT\Certificado_Venta_Interna\Documentos\Detalle de Certificados de Ventas Generados.xlsx"

def upload_to_supabase():
    if not SUPABASE_URL or not SUPABASE_KEY or SUPABASE_URL == "TU_URL_AQUI":
        print("❌ Error: SUPABASE_URL y SUPABASE_KEY no están configurados.")
        return

    print("🚀 Leyendo Excel local...")
    if not os.path.exists(EXCEL_PATH):
        print(f"❌ Error: No se encontró el archivo en {EXCEL_PATH}")
        return

    df = pd.read_excel(EXCEL_PATH)
    
    # Limpiar NaN/NaT para JSON
    df = df.where(pd.notnull(df), None)

    # Convertir fechas a string
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            df[col] = df[col].dt.strftime('%Y-%m-%d')

    data_records = df.to_dict(orient="records")

    print(f"✅ Se leyeron {len(data_records)} registros. Conectando a Supabase...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Opcional: Vaciar la tabla primero si queremos que sea un replace total
    # try:
    #     supabase.table('certificados_detalle').delete().neq("Comprobante", "dummy_value").execute()
    # except Exception as e:
    #     pass

    print("⏳ Subiendo datos en lotes...")
    batch_size = 500
    for i in range(0, len(data_records), batch_size):
        batch = data_records[i:i+batch_size]
        try:
            supabase.table('certificados_detalle').upsert(batch).execute()
            print(f"  -> Lote {i} a {i+len(batch)} subido.")
        except Exception as e:
            print(f"❌ Error subiendo lote {i}: {e}")
            break
            
    print("🎉 Proceso finalizado.")

if __name__ == "__main__":
    upload_to_supabase()
