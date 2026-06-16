import os
from dotenv import load_dotenv
load_dotenv('backend/.env')
import psycopg2

conn = psycopg2.connect(os.environ['SUPABASE_DB_URL'])
cur = conn.cursor()

# Crear tabla de provisiones de SAC
cur.execute("""
CREATE TABLE IF NOT EXISTS cert_rrhh_provisiones_sac (
    id SERIAL PRIMARY KEY,
    unidad_negocio VARCHAR(255) NOT NULL,
    periodo VARCHAR(10) NOT NULL,      -- Ej: "01/2026"
    semestre VARCHAR(10) NOT NULL,     -- "2026-S1" o "2026-S2"
    monto_provision NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(unidad_negocio, periodo)
);
""")

conn.commit()
print("Table cert_rrhh_provisiones_sac created successfully.")
conn.close()
