import sys
import os

sys.path.append(r"c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend")
from main import get_supabase

def create_tables():
    conn = get_supabase()
    cur = conn.cursor()
    try:
        print("Creating table cert_equipos_planilla...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS cert_equipos_planilla (
                id SERIAL PRIMARY KEY,
                unidad_negocio TEXT NOT NULL,
                periodo TEXT NOT NULL,
                equipo TEXT NOT NULL,
                concepto TEXT NOT NULL,
                horas_kilometros NUMERIC,
                precio_unitario NUMERIC,
                total NUMERIC,
                usuario_carga TEXT,
                fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        print("Creating table cert_obras_maestro...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS cert_obras_maestro (
                id SERIAL PRIMARY KEY,
                unidad_negocio TEXT NOT NULL,
                periodo TEXT NOT NULL,
                numero_interno INT NOT NULL,
                comitente TEXT,
                contratista TEXT,
                obra TEXT,
                fecha_certificado DATE,
                estado TEXT DEFAULT 'BORRADOR',
                usuario_carga TEXT,
                fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        print("Creating table cert_obras_detalles...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS cert_obras_detalles (
                id SERIAL PRIMARY KEY,
                maestro_id INT REFERENCES cert_obras_maestro(id) ON DELETE CASCADE,
                item TEXT,
                descripcion TEXT,
                unidad_medida TEXT,
                cantidad_aprobada NUMERIC,
                precio_unitario NUMERIC,
                presente_certificado NUMERIC,
                anterior_certificado NUMERIC,
                total_certificado NUMERIC,
                faltante_certificar NUMERIC,
                parcial_presente NUMERIC,
                parcial_anterior NUMERIC,
                parcial_total NUMERIC,
                monto_aprobado NUMERIC,
                avance_usd NUMERIC
            )
        """)
        conn.commit()
        print("Tables created successfully!")
    except Exception as e:
        conn.rollback()
        print("Error creating tables:", e)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    create_tables()
