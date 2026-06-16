import os
from dotenv import load_dotenv
load_dotenv('backend/.env')
import psycopg2

def setup_db():
    conn = psycopg2.connect(os.environ['SUPABASE_DB_URL'])
    conn.autocommit = True
    cur = conn.cursor()
    
    # Drop old tables if they exist
    try:
        cur.execute("DROP TABLE IF EXISTS cert_cierres_detalle CASCADE;")
        cur.execute("DROP TABLE IF EXISTS cert_cierres_mensuales CASCADE;")
    except Exception as e:
        print("Error dropping old tables:", e)
        
    # Create new table
    create_sql = """
    CREATE TABLE IF NOT EXISTS cert_informes_proyecto (
        id SERIAL PRIMARY KEY,
        unidad_negocio TEXT NOT NULL,
        periodo TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'ABIERTO',
        snapshot_data JSONB,
        usuario_apertura TEXT,
        fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        usuario_cierre TEXT,
        fecha_cierre TIMESTAMP,
        UNIQUE(unidad_negocio, periodo)
    );
    """
    
    try:
        cur.execute(create_sql)
        print("Table cert_informes_proyecto created successfully.")
    except Exception as e:
        print("Error creating table:", e)
        
    cur.close()
    conn.close()

if __name__ == '__main__':
    setup_db()
