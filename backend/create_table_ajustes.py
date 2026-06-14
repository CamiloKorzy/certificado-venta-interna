import os
import sys
import psycopg2

sys.path.append(os.path.abspath('c:\\Datos\\Proyectos IT\\Certificado_Venta_Interna\\backend'))
from main import get_supabase

def create_table():
    try:
        conn = get_supabase()
        cur = conn.cursor()
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS cert_ajustes_excel (
                id SERIAL PRIMARY KEY,
                unidad_negocio VARCHAR(255) NOT NULL,
                periodo VARCHAR(7) NOT NULL,
                concepto VARCHAR(255) NOT NULL,
                tipo_movimiento VARCHAR(50) NOT NULL,
                categoria VARCHAR(255),
                importe NUMERIC(15, 2) NOT NULL,
                observaciones TEXT,
                fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                usuario_carga VARCHAR(255)
            );
        """)
        
        conn.commit()
        cur.close()
        conn.close()
        print("Tabla cert_ajustes_excel creada correctamente.")
    except Exception as e:
        print(f"Error creando tabla: {e}")

if __name__ == "__main__":
    create_table()
