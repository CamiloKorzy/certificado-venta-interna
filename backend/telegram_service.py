"""
Servicio de Telegram para Certificados de Ventas Internos.
Replica el patrón de Compras_OC/telegram_service.py.
"""
import urllib.request
import urllib.error
import json
import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

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
                                unidad: str, total: float, link: str,
                                estado: str = "", es_modificacion: bool = False, finnegans_link: str = "",
                                actividad: str = "") -> dict:
    """Notifica al Responsable de UN que se registró un nuevo certificado o se modificó."""
    import html
    # Determinar si es modificación
    titulo = "NUEVO COMPROBANTE" if not es_modificacion else "COMPROBANTE MODIFICADO"
    
    mensaje = f"""📋 <b>[CERTIFICADO DE VENTA INTERNA]</b>
<b>{titulo}:</b> {comprobante}
<b>Unidad de Negocio:</b> {unidad}
<b>Descripción:</b> {descripcion}
<b>Total:</b> ${total:,.2f}"""

    if estado:
        mensaje += f"\n<b>Estado:</b> {estado}"
        
    if actividad:
        mensaje += f"\n⏳ <b>Actividad:</b> <i>{html.escape(actividad)}</i>"
        
    mensaje += f"\n\nSe requiere su revisión.\n👉 <a href=\"{link}\">Abrir Dashboard de Certificados</a>"

    reply_markup = None
    # Solo mostrar el botón de Autorizar si hay una actividad pendiente identificada
    if actividad and finnegans_link:
        # Botón con texto dinámico truncado si es muy largo (Telegram limite ~64 bytes)
        max_btn_len = 45
        short_act = actividad[:max_btn_len] + "..." if len(actividad) > max_btn_len else actividad
        btn_text = f"🔗 Autorizar: {short_act}"
        
        reply_markup = {
            "inline_keyboard": [
                [{"text": btn_text, "url": finnegans_link}]
            ]
        }
    
    return send_telegram_message(chat_id, mensaje, reply_markup=reply_markup)


def telegram_certificado_autorizado(chat_id: str, comprobante: str, 
                                     quien_autorizo: str) -> dict:
    """Confirma que un certificado fue autorizado."""
    mensaje = f"""✅ <b>[CERTIFICADO DE VENTA INTERNA]</b>
<b>Comprobante Autorizado:</b> {comprobante}
<b>Autorizado por:</b> {quien_autorizo}

El certificado ha sido aprobado correctamente."""
    
    return send_telegram_message(chat_id, mensaje)


def telegram_test(chat_id: str) -> dict:
    """Envía un mensaje de prueba para verificar conectividad."""
    mensaje = """🔔 <b>[CERTIFICADO DE VENTA INTERNA]</b>
<b>Test de Conectividad</b>
    
Este es un mensaje de prueba del sistema de Certificados de Ventas Internos CEE ENRIQUEZ.
Si recibió este mensaje, la integración con Telegram funciona correctamente y está lista para notificar comprobantes. ✅"""
    
    return send_telegram_message(chat_id, mensaje)
