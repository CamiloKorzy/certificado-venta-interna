"""
Servicio de Telegram para Certificados de Ventas Internos.
Replica el patrón de Compras_OC/telegram_service.py.
"""
import urllib.request
import urllib.error
import json
import os
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

def send_telegram_message(chat_id: str, text: str, reply_markup: dict = None) -> dict:
    """Envía un mensaje a través del bot de Telegram."""
    if not TELEGRAM_BOT_TOKEN or not chat_id:
        return {"ok": False, "error": "Falta token o chat_id"}
        
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    
    if reply_markup:
        payload["reply_markup"] = reply_markup
        
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            if res_data.get('ok'):
                return {"ok": True}
            else:
                err = f"Error Telegram API: {res_data.get('description')}"
                print(f"[Telegram Error] {chat_id}: {err}")
                return {"ok": False, "error": err}
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        err = f"Error HTTP {e.code}: {err_msg}"
        print(f"[Telegram Error] {chat_id}: {err}")
        return {"ok": False, "error": err}
    except Exception as e:
        err = f"Error: {e}"
        print(f"[Telegram Error] {chat_id}: {e}")
        return {"ok": False, "error": err}


def telegram_nuevo_certificado(chat_id: str, comprobante: str, descripcion: str, 
                                unidad: str, total: float, link: str) -> dict:
    """Notifica al Responsable de UN que se registró un nuevo certificado."""
    mensaje = f"""📋 <b>Nuevo Certificado de Venta Interna</b>
<b>Comprobante:</b> {comprobante}
<b>Unidad de Negocio:</b> {unidad}
<b>Descripción:</b> {descripcion}
<b>Total:</b> ${total:,.2f}

Se requiere su revisión y autorización.
👉 <a href="{link}">Abrir Dashboard de Certificados</a>"""
    
    return send_telegram_message(chat_id, mensaje)


def telegram_certificado_autorizado(chat_id: str, comprobante: str, 
                                     quien_autorizo: str) -> dict:
    """Confirma que un certificado fue autorizado."""
    mensaje = f"""✅ <b>Certificado Autorizado</b>
<b>Comprobante:</b> {comprobante}
<b>Autorizado por:</b> {quien_autorizo}

El certificado ha sido aprobado correctamente."""
    
    return send_telegram_message(chat_id, mensaje)


def telegram_test(chat_id: str) -> dict:
    """Envía un mensaje de prueba para verificar conectividad."""
    mensaje = """🔔 <b>Test de Conectividad</b>
    
Este es un mensaje de prueba del sistema de Certificados de Ventas Internos CEE ENRIQUEZ.
Si recibió este mensaje, la integración con Telegram funciona correctamente. ✅"""
    
    return send_telegram_message(chat_id, mensaje)
