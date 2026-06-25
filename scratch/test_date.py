from datetime import datetime

fecha_raw = "2026-05-31 00:00:00.0"
try:
    if isinstance(fecha_raw, datetime):
        print("is datetime")
        fecha_fmt = fecha_raw.strftime('%d/%m/%Y')
    elif isinstance(fecha_raw, str) and len(fecha_raw) >= 10:
        print("is str >= 10")
        fecha_fmt = datetime.strptime(fecha_raw[:10], '%Y-%m-%d').strftime('%d/%m/%Y')
    else:
        print("else")
        fecha_fmt = str(fecha_raw)
except Exception as e:
    print("Exception:", e)
    fecha_fmt = str(fecha_raw)
    
print("Result:", fecha_fmt)
