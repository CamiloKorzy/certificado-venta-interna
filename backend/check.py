import psycopg2

try:
    conn = psycopg2.connect(
        host='ceesa.dw.finneg.com',
        port=5432,
        dbname='finnegansbi',
        user='ceesauser',
        password='Lula$$2014'
    )
    cur = conn.cursor()
    cur.execute("SELECT comprobante, documento, empresa FROM ceesa_cee_certificados_ventas_internas WHERE empresa='Seguridad de Activos'")
    rows = cur.fetchall()
    print("Filas de Seguridad de Activos:", len(rows))
    print("Primeras 5:", rows[:5])
    
    cur.execute("SELECT comprobante, documento, empresa FROM ceesa_cee_certificados_ventas_internas WHERE empresa!='Seguridad de Activos'")
    rows2 = cur.fetchall()
    print("Filas de otras:", len(rows2))
    print("Primeras 5 otras:", rows2[:5])
except Exception as e:
    print(e)
