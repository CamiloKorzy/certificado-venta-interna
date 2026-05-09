from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import psycopg2
from datetime import datetime
import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import sys
import traceback

# INYECCIÓN CRÍTICA PARA VERCEL: los módulos están en /var/task/backend
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from auth import hash_password, verify_password, create_token, decode_token
from telegram_service import telegram_nuevo_certificado, telegram_test

app = FastAPI(title="API Certificado de Ventas Internos - CEE ENRIQUEZ")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware que atrapa TODAS las excepciones y devuelve JSON informativo
from fastapi.responses import JSONResponse

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        tb = traceback.format_exc()
        print(f"UNHANDLED EXCEPTION: {tb}")
        return JSONResponse(status_code=500, content={"error": str(e), "trace": tb[:500]})

# ─── Credenciales ───
DB_HOST = os.environ.get("DB_HOST", "infraestructura-aurora-datawarehouse-instance-zxhlvevffc1c.cijt7auhxunw.us-east-1.rds.amazonaws.com")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "finnegansbi")
DB_USER = os.environ.get("DB_USER", "ceesauser")
DB_PASS = os.environ.get("DB_PASS", "Lula$$2014")
SUPABASE_DB_URL = os.environ.get("SUPABASE_DB_URL", "postgresql://postgres:FsIPyXBJT8aFZk8D@db.rsofgomdfrrvawvqybxp.supabase.co:5432/postgres")
APP_URL = os.environ.get("APP_URL", "https://certificado-venta-interna.vercel.app")

def get_aurora():
    return psycopg2.connect(host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASS, sslmode="require")

import socket

# PARCHE PARA VERCEL: Forzar IPv4 (AF_INET)
# Vercel intenta usar IPv6 por defecto para Supabase, pero falla con "Cannot assign requested address".
old_getaddrinfo = socket.getaddrinfo
def new_getaddrinfo(*args, **kwargs):
    responses = old_getaddrinfo(*args, **kwargs)
    return [r for r in responses if r[0] == socket.AF_INET]
socket.getaddrinfo = new_getaddrinfo

def get_supabase():
    if not SUPABASE_DB_URL:
        raise HTTPException(status_code=500, detail="SUPABASE_DB_URL no configurada")
    try:
        return psycopg2.connect(SUPABASE_DB_URL, connect_timeout=10)
    except Exception as e:
        if "Cannot assign requested address" in str(e) or "IPv6" in str(e):
            raise HTTPException(
                status_code=500, 
                detail="Error de IPv6 en Vercel. Por favor, entrá a Supabase -> Project Settings -> Database y copiá la URL del 'Connection Pooler' (puerto 6543) y reemplazá SUPABASE_DB_URL en Vercel."
            )
        raise e

# ─── Auto-setup: crea tablas en Supabase si no existen ───
_setup_done = False
def auto_setup_db():
    global _setup_done
    if _setup_done:
        return
    _setup_done = True
    if not SUPABASE_DB_URL:
        print("[SETUP] SUPABASE_DB_URL no configurada, saltando auto-setup")
        return
    try:
        conn = psycopg2.connect(SUPABASE_DB_URL, connect_timeout=10)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS cert_usuarios (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                nombre TEXT NOT NULL,
                password TEXT NOT NULL,
                rol TEXT NOT NULL,
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
            CREATE INDEX IF NOT EXISTS idx_cert_usuarios_email ON cert_usuarios(email);
            CREATE INDEX IF NOT EXISTS idx_cert_usu_unid_usuario ON cert_usuarios_unidades(usuario_id);
            CREATE INDEX IF NOT EXISTS idx_cert_notif_fecha ON cert_notificaciones_log(fecha);
            
            CREATE TABLE IF NOT EXISTS cert_audit_log (
                id SERIAL PRIMARY KEY,
                usuario_email TEXT,
                accion TEXT,
                detalles TEXT,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_cert_audit_fecha ON cert_audit_log(fecha);
        """)
        # Crear admin por defecto si no existe
        cur.execute("SELECT COUNT(*) FROM cert_usuarios WHERE email = 'admin@ceeenriquez.com'")
        if cur.fetchone()[0] == 0:
            admin_hash = hash_password("admin2026")
            cur.execute("""
                INSERT INTO cert_usuarios (email, nombre, password, rol, activo)
                VALUES ('admin@ceeenriquez.com', 'Administrador', %s, 'admin', 1)
            """, (admin_hash,))
            print("[SETUP] ✅ Usuario admin creado: admin@ceeenriquez.com / admin2026")
            
        # Migración: Agregar columna estado_doc si no existe
        try:
            cur.execute("ALTER TABLE cert_notificaciones_log ADD COLUMN IF NOT EXISTS estado_doc TEXT;")
        except Exception as e:
            pass
            
        print("[SETUP] ✅ Tablas cert_* verificadas/creadas")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"[SETUP] ⚠️ Error en auto-setup: {e}")
        _setup_done = False  # Reintentar en próxima llamada

def log_action(email: str, accion: str, detalles: str = ""):
    try:
        conn = get_supabase()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO cert_audit_log (usuario_email, accion, detalles) VALUES (%s, %s, %s)",
            (email, accion, detalles)
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"[AUDIT LOG ERROR] {e}")

# ─── Auth Dependency ───
async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    token = auth_header.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    return payload

async def require_admin(user=Depends(get_current_user)):
    if user.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado: se requiere rol admin")
    return user

# ─── Pydantic Models ───
class LoginRequest(BaseModel):
    email: str
    password: str

class UsuarioCreate(BaseModel):
    nombre: str
    email: str
    password: str
    rol: str = "consulta"
    telegram_chat_id: Optional[str] = None
    activo: int = 1

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    rol: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    activo: Optional[int] = None

class UnidadAsignacion(BaseModel):
    unidad_negocio: str
    notifica_email: bool = False
    notifica_telegram: bool = False

# ═══════════════════════════════════════════════════════
# ENDPOINTS DE AUTENTICACIÓN
# ═══════════════════════════════════════════════════════

@app.get("/api/health")
def health_check():
    import traceback
    try:
        info = {"status": "ok", "supabase_url_set": bool(SUPABASE_DB_URL), "setup_done": _setup_done}
        info["supabase_url_preview"] = SUPABASE_DB_URL[:30] + "..." if SUPABASE_DB_URL else "VACIA"
        # Test Supabase connectivity
        try:
            conn = psycopg2.connect(SUPABASE_DB_URL, connect_timeout=5)
            cur = conn.cursor()
            cur.execute("SELECT 1")
            info["supabase_connect"] = "OK"
            try:
                cur.execute("SELECT COUNT(*) FROM cert_usuarios")
                count = cur.fetchone()[0]
                info["users_count"] = count
            except Exception as e2:
                info["table_check"] = f"tabla no existe: {str(e2)[:100]}"
            cur.close()
            conn.close()
        except Exception as e:
            info["supabase_connect"] = f"error: {str(e)[:200]}"
        return info
    except Exception as e:
        return {"error": str(e), "trace": traceback.format_exc()[:500]}

@app.get("/api/setup")
def run_setup():
    import traceback
    try:
        global _setup_done
        _setup_done = False
        auto_setup_db()
        return {"status": "setup ejecutado", "done": _setup_done}
    except Exception as e:
        return {"error": str(e), "trace": traceback.format_exc()[:500]}

@app.post("/api/login")
def login(req: LoginRequest):
    auto_setup_db()  # Asegurar tablas existen
    conn = get_supabase()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, email, nombre, password, rol, activo FROM cert_usuarios WHERE email = %s", (req.email,))
        row = cur.fetchone()
        cur.close()
        
        if not row:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
        user_id, email, nombre, pwd_hash, rol, activo = row
        
        if not activo:
            raise HTTPException(status_code=401, detail="Usuario desactivado")
        
        if not verify_password(req.password, pwd_hash):
            log_action(req.email, "LOGIN_FAILED", "Intento de login con contraseña incorrecta")
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
        token = create_token(user_id, email, rol, nombre)
        log_action(email, "LOGIN", "Inicio de sesión exitoso")
        return {"token": token, "user": {"id": user_id, "email": email, "nombre": nombre, "rol": rol}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)[:200]}")
    finally:
        conn.close()

@app.get("/api/me")
def get_me(user=Depends(get_current_user)):
    return {"user": user}

# ═══════════════════════════════════════════════════════
# CRUD USUARIOS (Solo Admin)
# ═══════════════════════════════════════════════════════

@app.get("/api/usuarios")
def list_usuarios(admin=Depends(require_admin)):
    conn = get_supabase()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT u.id, u.email, u.nombre, u.rol, u.telegram_chat_id, u.activo, u.created_at,
                   (SELECT COUNT(*) FROM cert_usuarios_unidades cu WHERE cu.usuario_id = u.id) as sucursales_asignadas
            FROM cert_usuarios u
            ORDER BY u.id
        """)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close()
        return {"data": rows}
    finally:
        conn.close()

@app.post("/api/usuarios")
def create_usuario(body: UsuarioCreate, admin=Depends(require_admin)):
    conn = get_supabase()
    try:
        cur = conn.cursor()
        pwd_hash = hash_password(body.password)
        cur.execute("""
            INSERT INTO cert_usuarios (email, nombre, password, rol, telegram_chat_id, activo)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
        """, (body.email, body.nombre, pwd_hash, body.rol, body.telegram_chat_id, body.activo))
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        log_action(admin["email"], "NUEVO_USUARIO", f"Creó usuario {body.email} (Rol: {body.rol})")
        return {"ok": True, "id": new_id}
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Email ya registrado")
    finally:
        conn.close()

@app.put("/api/usuarios/{user_id}")
def update_usuario(user_id: int, body: UsuarioUpdate, admin=Depends(require_admin)):
    conn = get_supabase()
    try:
        cur = conn.cursor()
        updates = []
        params = []
        
        if body.nombre is not None:
            updates.append("nombre = %s"); params.append(body.nombre)
        if body.email is not None:
            updates.append("email = %s"); params.append(body.email)
        if body.password and body.password.strip():
            updates.append("password = %s"); params.append(hash_password(body.password))
        if body.rol is not None:
            updates.append("rol = %s"); params.append(body.rol)
        if body.telegram_chat_id is not None:
            updates.append("telegram_chat_id = %s"); params.append(body.telegram_chat_id)
        if body.activo is not None:
            updates.append("activo = %s"); params.append(body.activo)
        
        if not updates:
            return {"ok": True}
        
        params.append(user_id)
        cur.execute(f"UPDATE cert_usuarios SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()
        cur.close()
        log_action(admin["email"], "ACTUALIZAR_USUARIO", f"Actualizó usuario ID {user_id}")
        return {"ok": True}
    finally:
        conn.close()

@app.delete("/api/usuarios/{user_id}")
def delete_usuario(user_id: int, admin=Depends(require_admin)):
    conn = get_supabase()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM cert_usuarios WHERE id = %s", (user_id,))
        conn.commit()
        cur.close()
        log_action(admin["email"], "ELIMINAR_USUARIO", f"Eliminó usuario ID {user_id}")
        return {"ok": True}
    finally:
        conn.close()

# ═══════════════════════════════════════════════════════
# GESTIÓN DE UNIDADES DE NEGOCIO POR USUARIO
# ═══════════════════════════════════════════════════════

@app.get("/api/usuarios/{user_id}/unidades")
def get_user_unidades(user_id: int, user=Depends(get_current_user)):
    conn = get_supabase()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT unidad_negocio, notifica_email, notifica_telegram 
            FROM cert_usuarios_unidades WHERE usuario_id = %s ORDER BY unidad_negocio
        """, (user_id,))
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close()
        return {"data": rows}
    except Exception as e:
        print(f"Error en get_user_unidades: {e}")
        return {"data": []}
    finally:
        conn.close()

@app.put("/api/usuarios/{user_id}/unidades")
def update_user_unidades(user_id: int, body: List[UnidadAsignacion], admin=Depends(require_admin)):
    conn = get_supabase()
    try:
        cur = conn.cursor()
        # Borrar asignaciones previas
        cur.execute("DELETE FROM cert_usuarios_unidades WHERE usuario_id = %s", (user_id,))
        # Insertar nuevas
        for u in body:
            if u.notifica_email or u.notifica_telegram:
                cur.execute("""
                    INSERT INTO cert_usuarios_unidades (usuario_id, unidad_negocio, notifica_email, notifica_telegram)
                    VALUES (%s, %s, %s, %s)
                """, (user_id, u.unidad_negocio, u.notifica_email, u.notifica_telegram))
        conn.commit()
        cur.close()
        log_action(admin["email"], "ACTUALIZAR_SUCURSALES", f"Actualizó sucursales para usuario ID {user_id}")
        return {"ok": True}
    finally:
        conn.close()

@app.get("/api/audit-logs")
def get_audit_logs(admin=Depends(require_admin)):
    conn = get_supabase()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, usuario_email, accion, detalles, fecha FROM cert_audit_log ORDER BY fecha DESC LIMIT 500")
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close()
        return {"data": rows}
    finally:
        conn.close()

# ═══════════════════════════════════════════════════════
# CRON & BOT
# ═══════════════════════════════════════════════════════

@app.get("/api/cron/notificar")
def cron_notificar():
    """Endpoint llamado periódicamente por Vercel Cron para notificar nuevos certificados."""
    conn_supa = get_supabase()
    conn_aurora = None
    try:
        cur_supa = conn_supa.cursor()
        cur_supa.execute("SELECT comprobante, estado_doc FROM cert_notificaciones_log WHERE tipo = 'cron_telegram'")
        ya_notificados = {row[0]: row[1] for row in cur_supa.fetchall()}
        
        conn_aurora = get_aurora()
        cur_aurora = conn_aurora.cursor()
        # Obtener los últimos 200 comprobantes con un SELECT * para obtener esquema dinámico
        cur_aurora.execute("""
            SELECT *
            FROM ceesa_cee_certificados_ventas_internos
            WHERE numerodocumento IS NOT NULL AND numerodocumento != '' AND numerodocumento != 'NULL'
            ORDER BY numerodocumento DESC
            LIMIT 200
        """)
        cols = [desc[0].lower() for desc in cur_aurora.description]
        recientes_rows = cur_aurora.fetchall()
        cur_aurora.close()
        
        a_notificar = []
        for row in recientes_rows:
            record = dict(zip(cols, row))
            doc = str(record.get('numerodocumento') or '').strip()
            if not doc or doc == 'NULL': continue
            
            un = str(record.get('unidaddenegocio') or '').strip()
            desc = str(record.get('documentodescripcion') or record.get('detalledescripcion') or '').strip()
            imp = record.get('importe', 0)
            
            # Buscar el estado actual y el id transaccional
            estado_actual = str(record.get('estadoautorizacion', '')).strip()
            # transaccionid suele ser el campo ID en Finnegans, si no id
            trans_id = record.get('transaccionid') or record.get('id') or ''
            
            # Extraer actividad para botones SOLO si el estado está pendiente (lógica de Compras)
            actividad = ""
            estados_pendientes = ["doc. pendiente firmar", "pendiente de autorización", "autorización", "pendiente"]
            if estado_actual.lower() in estados_pendientes:
                for k in ['actividadworkflow', 'actividad', 'nombreactividad']:
                    if record.get(k) and str(record.get(k)).strip() and str(record.get(k)).strip().upper() not in ('NONE', 'NULL', ''):
                        actividad = str(record.get(k)).strip()
                        break
                
                if not actividad and un:
                    nombre_sucursal = un.replace(' CEE Enriquez', '').replace(' CEE', '').strip()
                    actividad = f"Autoriza N1 por {nombre_sucursal}"
            
            estado_previo = ya_notificados.get(doc)
            es_modificacion = False
            
            if doc not in ya_notificados:
                # Es nuevo
                a_notificar.append((doc, un, desc, imp, estado_actual, trans_id, es_modificacion, actividad))
            elif estado_previo != estado_actual and estado_actual:
                # Modificado (el estado cambió y no está vacío)
                es_modificacion = True
                a_notificar.append((doc, un, desc, imp, estado_actual, trans_id, es_modificacion, actividad))
                
        enviados = 0
        for doc, un, desc, imp_raw, estado, trans_id, es_modificacion, actividad in a_notificar:
            try:
                imp = float(str(imp_raw or '0').replace(',', '.'))
            except:
                imp = 0.0
                
            finnegans_link = ""
            if trans_id:
                # Generar link al comprobante
                finnegans_link = f"https://go.finneg.com/mas/vista?fafViewCode=DF_VIEWER&pk={trans_id}&claseVO=CasoDirectoVO&FAFCLASE_FACADE=FAFTransaccionBSuiteEJB&appitemID=50394"
                
            # Buscar destinatarios
            cur_supa.execute("""
                SELECT u.nombre, u.telegram_chat_id 
                FROM cert_usuarios_unidades cu 
                JOIN cert_usuarios u ON cu.usuario_id = u.id 
                WHERE cu.unidad_negocio = %s AND cu.notifica_telegram = true AND u.activo = 1
            """, (un,))
            destinatarios = cur_supa.fetchall()
            
            if destinatarios:
                for nombre, chat_id in destinatarios:
                    if chat_id:
                        telegram_nuevo_certificado(
                            chat_id=chat_id, 
                            comprobante=doc, 
                            descripcion=desc, 
                            unidad=un, 
                            total=imp, 
                            link=APP_URL, 
                            estado=estado, 
                            es_modificacion=es_modificacion, 
                            finnegans_link=finnegans_link,
                            actividad=actividad
                        )
            
            # Marcar o actualizar como notificado
            if not es_modificacion:
                cur_supa.execute("""
                    INSERT INTO cert_notificaciones_log (tipo, comprobante, mensaje, estado, estado_doc)
                    VALUES ('cron_telegram', %s, 'Procesado por cron', 'ok', %s)
                """, (doc, estado))
            else:
                cur_supa.execute("""
                    UPDATE cert_notificaciones_log 
                    SET estado_doc = %s, fecha = CURRENT_TIMESTAMP
                    WHERE comprobante = %s AND tipo = 'cron_telegram'
                """, (estado, doc))
                
            conn_supa.commit()
            enviados += 1
            
        cur_supa.close()
        return {"ok": True, "procesados": enviados, "total_revisados": len(recientes_rows)}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn_supa:
            conn_supa.close()
        if conn_aurora:
            conn_aurora.close()

@app.get("/api/debug-unidades")
def debug_unidades():
    """Endpoint PÚBLICO de diagnóstico para verificar conectividad Aurora y columnas disponibles."""
    import traceback
    result = {"step": "init", "aurora_host": DB_HOST[:40] + "..."}
    try:
        result["step"] = "connecting"
        conn = get_aurora()
        result["step"] = "connected"
        cur = conn.cursor()
        
        # 1. Verificar que la tabla existe y obtener columnas
        cur.execute("SELECT * FROM ceesa_cee_certificados_ventas_internos LIMIT 1")
        columns = [desc[0].lower() for desc in cur.description]
        result["columns_count"] = len(columns)
        result["columns_sample"] = columns[:20]
        
        # 2. Buscar columna de unidad de negocio
        un_col = next((c for c in columns if 'unidad' in c and 'negocio' in c), None)
        result["un_column_found"] = un_col
        
        if not un_col:
            result["error"] = "No se encontró columna con 'unidad' y 'negocio'"
            cur.close(); conn.close()
            return result
        
        # 3. Contar registros totales
        cur.execute(f"SELECT COUNT(*) FROM ceesa_cee_certificados_ventas_internos")
        result["total_rows"] = cur.fetchone()[0]
        
        # 4. Obtener unidades distintas
        query = f"""
            SELECT DISTINCT TRIM(COALESCE({un_col}, '')) as un 
            FROM ceesa_cee_certificados_ventas_internos 
            WHERE {un_col} IS NOT NULL AND TRIM(COALESCE({un_col}, '')) != ''
            ORDER BY un
        """
        cur.execute(query)
        unidades = [row[0] for row in cur.fetchall() if row[0]]
        result["unidades_count"] = len(unidades)
        result["unidades"] = unidades
        result["status"] = "OK"
        
        cur.close()
        conn.close()
        return result
    except Exception as e:
        result["error"] = str(e)
        result["trace"] = traceback.format_exc()[:500]
        return result

@app.get("/api/unidades-negocio")
def list_unidades(user=Depends(get_current_user)):
    """Obtiene las Unidades de Negocio disponibles desde el dataset de Aurora."""
    conn = None
    try:
        conn = get_aurora()
        cur = conn.cursor()
        
        # Primero buscamos dinámicamente cómo se llama la columna
        cur.execute("SELECT * FROM ceesa_cee_certificados_ventas_internos LIMIT 1")
        columns = [desc[0].lower() for desc in cur.description]
        
        un_col = next((c for c in columns if 'unidad' in c and 'negocio' in c), None)
        if not un_col:
            # Fallback a un nombre probable si está vacía la tabla
            un_col = 'unidaddenegocio'
            
        # Ahora consultamos usando la columna real
        query = f"""
            SELECT DISTINCT TRIM(COALESCE({un_col}, '')) as un 
            FROM ceesa_cee_certificados_ventas_internos 
            WHERE {un_col} IS NOT NULL AND TRIM(COALESCE({un_col}, '')) != ''
            ORDER BY un
        """
        cur.execute(query)
        unidades = [row[0] for row in cur.fetchall() if row[0]]
        cur.close()
        return {"data": unidades}
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"Error en list_unidades: {e}\n{tb}")
        return {"data": [], "error": str(e), "trace": tb[:300]}
    finally:
        if conn:
            conn.close()

# ═══════════════════════════════════════════════════════
# NOTIFICACIONES TELEGRAM
# ═══════════════════════════════════════════════════════

@app.post("/api/notificar-certificado/{comprobante}")
def notificar_certificado(comprobante: str, user=Depends(get_current_user)):
    """Envía notificación Telegram a los responsables de la UN del certificado."""
    # 1. Obtener datos del certificado desde Aurora
    conn_aurora = None
    conn_supa = None
    try:
        conn_aurora = get_aurora()
        cur = conn_aurora.cursor()
        cur.execute("""
            SELECT DISTINCT unidaddenegocio, documentodescripcion, importe
            FROM ceesa_cee_certificados_ventas_internos 
            WHERE numerodocumento = %s
            ORDER BY CAST(NULLIF(importe,'0') AS DECIMAL) DESC NULLS LAST
            LIMIT 1
        """, (comprobante,))
        row = cur.fetchone()
        cur.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Certificado no encontrado")
        
        unidad = (row[0] or '').strip()
        descripcion = (row[1] or '').strip()
        try:
            total = float(row[2] or 0)
        except:
            total = 0.0
        
        # 2. Buscar responsables de esa UN con Telegram activo
        conn_supa = get_supabase()
        cur2 = conn_supa.cursor()
        cur2.execute("""
            SELECT u.nombre, u.telegram_chat_id 
            FROM cert_usuarios u
            JOIN cert_usuarios_unidades uu ON u.id = uu.usuario_id
            WHERE uu.unidad_negocio = %s 
              AND uu.notifica_telegram = true 
              AND u.telegram_chat_id IS NOT NULL 
              AND u.telegram_chat_id != ''
              AND u.activo = 1
        """, (unidad,))
        destinatarios = cur2.fetchall()
        
        resultados = []
        for nombre, chat_id in destinatarios:
            res = telegram_nuevo_certificado(
                chat_id=chat_id,
                comprobante=comprobante,
                descripcion=descripcion,
                unidad=unidad,
                total=total,
                link=APP_URL
            )
            # Log de notificación
            cur2.execute("""
                INSERT INTO cert_notificaciones_log (tipo, destinatario, comprobante, mensaje, estado)
                VALUES ('telegram', %s, %s, %s, %s)
            """, (nombre, comprobante, f"Nuevo certificado {comprobante}", "ok" if res.get("ok") else "error"))
            resultados.append({"nombre": nombre, "ok": res.get("ok", False)})
        
        conn_supa.commit()
        cur2.close()
        
        return {"ok": True, "notificados": len(resultados), "detalle": resultados}
    finally:
        if conn_aurora:
            conn_aurora.close()
        if conn_supa:
            conn_supa.close()

@app.post("/api/telegram-test/{user_id}")
def test_telegram(user_id: int, admin=Depends(require_admin)):
    """Envía un mensaje de prueba al Telegram del usuario."""
    conn = get_supabase()
    try:
        cur = conn.cursor()
        cur.execute("SELECT telegram_chat_id FROM cert_usuarios WHERE id = %s", (user_id,))
        row = cur.fetchone()
        cur.close()
        
        if not row or not row[0]:
            raise HTTPException(status_code=400, detail="Usuario sin Chat ID de Telegram")
        
        result = telegram_test(row[0])
        return result
    finally:
        conn.close()

# ═══════════════════════════════════════════════════════
# DASHBOARD — INDICADORES (Mantener endpoint existente)
# ═══════════════════════════════════════════════════════

@app.get("/api/debug")
def debug_endpoint():
    conn = get_aurora()
    cur = conn.cursor()
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
def get_indicadores(user=Depends(get_current_user)):
    conn = None
    try:
        conn = get_aurora()
        
        query = "SELECT * FROM ceesa_cee_certificados_ventas_internos ORDER BY 1 DESC LIMIT 50000"
        
        cursor = conn.cursor()
        cursor.execute(query)
        columns_db = [desc[0] for desc in cursor.description]
        data_rows = cursor.fetchall()
        cursor.close()
        
        # ─── PASO 1: Agrupar por numerodocumento ───
        states_priority = {'Autorizado': 4, 'Rechazado': 3, 'Anulado': 3, 'Pendiente': 2, 'Sin Estado': 1, '': 0}
        
        comprobantes = {}
        for row in data_rows:
            record = dict(zip(columns_db, row))
            num_doc = record.get('numerodocumento', '')
            if not num_doc or num_doc == 'NULL':
                continue
                
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
                    'distinct_importes': set(),
                }
            
            if imp > comprobantes[num_doc]['max_importe']:
                comprobantes[num_doc]['max_importe'] = imp
            
            if imp > 0:
                comprobantes[num_doc]['distinct_importes'].add(round(imp, 2))
            
            if states_priority.get(state, 0) > states_priority.get(comprobantes[num_doc]['best_state'], 0):
                comprobantes[num_doc]['best_state'] = state
            
            if producto and producto != 'NULL':
                if producto not in comprobantes[num_doc]['items']:
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
        
        # ─── PASO 2: Construir registros finales ───
        records = []
        for num_doc, data in comprobantes.items():
            meta = data['metadata']
            
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
            
            def clean(val):
                if val is None or val == 'NULL':
                    return ''
                return str(val).strip()
            
            desc = clean(meta.get('documentodescripcion', ''))
            if not desc:
                desc = clean(meta.get('detalledescripcion', ''))
            
            items_list = list(data['items'].values())
            
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
                'UnidadNegocio': clean(meta.get('unidaddenegocio', '')),
                'items': items_list,
            }
            records.append(record)
        
        if not records:
            raise Exception("No data found en Aurora")
            
        final_columns = ['Fecha', 'Comprobante', 'Empresa', 'Descripción', 'Solicitante', 'EstadoAutorizacion', 'Neto Gravado', 'IVA', 'Total Bruto', 'UnidadNegocio']
        
    except Exception as e:
        print(f"Error consultando BD: {e}")
        records = [
            {'Fecha': '01/05/2026', 'Comprobante': 'CVI-0001', 'Descripción': 'Mock', 'Empresa': 'CEE', 'Total Bruto': '0', 'Neto Gravado': '0', 'IVA': '0', 'EstadoAutorizacion': 'Sin Estado', 'Solicitante': '', 'UnidadNegocio': '', 'items': []}
        ]
        final_columns = list(records[0].keys())

    finally:
        if conn:
            conn.close()

    # ─── PASO 3: KPIs ───
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
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
