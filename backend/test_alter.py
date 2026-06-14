import psycopg2
from dotenv import load_dotenv
import os

try:
    conn = psycopg2.connect("postgresql://postgres.rsofgomdfrrvawvqybxp:FsIPyXBJT8aFZk8D@aws-0-sa-east-1.pooler.supabase.com:6543/postgres")
    cur = conn.cursor()
    
    # Add sucursal column to tables if not exists
    queries = [
        "ALTER TABLE cert_config_ingresos_comprobantes ADD COLUMN IF NOT EXISTS sucursal TEXT;",
        "ALTER TABLE cert_config_gastos_asientos ADD COLUMN IF NOT EXISTS sucursal TEXT;",
        "ALTER TABLE cert_config_gastos_compras ADD COLUMN IF NOT EXISTS sucursal TEXT;"
    ]
    
    for q in queries:
        try:
            cur.execute(q)
            conn.commit()
            print("Executed:", q)
        except Exception as e:
            conn.rollback()
            print("Failed:", q, e)
            
    cur.close()
    conn.close()
except Exception as e:
    print("Connection error:", e)
