"""
Módulo de autenticación JWT + bcrypt para Certificados de Ventas Internos.
Replica el patrón de Compras_OC adaptado a este dominio.
"""
import os
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.hash import bcrypt
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "cert_ventas_interno_secret_2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

def hash_password(password: str) -> str:
    return bcrypt.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.verify(password, hashed)
    except Exception:
        return False

def create_token(user_id: int, email: str, rol: str, nombre: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "rol": rol,
        "nombre": nombre,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None
