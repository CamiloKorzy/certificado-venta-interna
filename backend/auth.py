"""
Módulo de autenticación JWT + hash SHA-256 para Certificados de Ventas Internos.
Usa PyJWT (compatible con Vercel) en vez de python-jose.
Usa hashlib (stdlib) en vez de bcrypt/passlib para evitar problemas de compilación.
"""
import os
import hashlib
import hmac
from datetime import datetime, timedelta

try:
    import jwt  # PyJWT
except ImportError:
    jwt = None

JWT_SECRET = os.environ.get("JWT_SECRET", "cert_ventas_interno_secret_2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Salt para el hash de contraseñas
SALT = os.environ.get("HASH_SALT", "cee_cert_2026_salt")

def hash_password(password: str) -> str:
    """Hash password usando SHA-256 con salt. Compatible con cualquier runtime."""
    salted = f"{SALT}:{password}"
    return hashlib.sha256(salted.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Verifica password contra el hash almacenado."""
    try:
        return hmac.compare_digest(hash_password(password), hashed)
    except Exception:
        return False

def create_token(user_id: int, email: str, rol: str, nombre: str) -> str:
    if not jwt:
        raise RuntimeError("PyJWT no instalado")
    payload = {
        "sub": str(user_id),
        "email": email,
        "rol": rol,
        "nombre": nombre,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict | None:
    if not jwt:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except Exception:
        return None
