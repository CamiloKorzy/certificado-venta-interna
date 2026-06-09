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
    cur.execute("SELECT DISTINCT fecha, fechaalta FROM ceesa_cee_certificados_ventas_internas WHERE empresa='Seguridad de Activos'")
    rows = cur.fetchall()
    print("Fechas Seguridad de Activos:", rows)
except Exception as e:
    print(e)
