import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(override=True)
PG_URL = os.getenv("SUPABASE_DB_URL")

if not PG_URL:
    print("Falta SUPABASE_DB_URL en .env")
    exit(1)

SCHEMA = """
-- ═══════════════════════════════════════════════════════
-- CERTIFICADOS DE VENTAS INTERNOS - Schema Supabase
-- Prefijo cert_ para evitar colisión con Compras_OC
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cert_usuarios (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    password TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('admin','responsable_un','consulta')),
    telegram_chat_id TEXT,
    activo INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cert_usuarios_unidades (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES cert_usuarios(id) ON DELETE CASCADE,
    unidad_negocio TEXT NOT NULL,
    notifica_email BOOLEAN DEFAULT false,
    notifica_telegram BOOLEAN DEFAULT false,
    UNIQUE(usuario_id, unidad_negocio)
);

CREATE TABLE IF NOT EXISTS cert_notificaciones_log (
    id SERIAL PRIMARY KEY,
    tipo TEXT,
    destinatario TEXT,
    comprobante TEXT,
    mensaje TEXT,
    estado TEXT,
    error TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cert_usuarios_email ON cert_usuarios(email);
CREATE INDEX IF NOT EXISTS idx_cert_usu_unid_usuario ON cert_usuarios_unidades(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cert_notif_fecha ON cert_notificaciones_log(fecha);
"""

def setup_db():
    conn = psycopg2.connect(PG_URL)
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            print("Creando tablas cert_* en Supabase...")
            cur.execute(SCHEMA)
            
            # Crear usuario admin por defecto si no existe
            from passlib.hash import bcrypt
            admin_hash = bcrypt.hash("admin2026")
            cur.execute("""
                INSERT INTO cert_usuarios (email, nombre, password, rol, activo)
                VALUES ('admin@ceeenriquez.com', 'Administrador', %s, 'admin', 1)
                ON CONFLICT (email) DO NOTHING
            """, (admin_hash,))
            
            print("✅ Tablas creadas. Usuario admin por defecto: admin@ceeenriquez.com / admin2026")
    finally:
        conn.close()

if __name__ == "__main__":
    setup_db()
