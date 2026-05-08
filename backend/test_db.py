import psycopg2

conn = psycopg2.connect(host='infraestructura-aurora-datawarehouse-instance-zxhlvevffc1c.cijt7auhxunw.us-east-1.rds.amazonaws.com', port='5432', database='finnegansbi', user='ceesauser', password='Lula$$2014', sslmode='require')
cur = conn.cursor()
cur.execute("SELECT numerodocumento, importe, estadoautorizacion, cantidadworkflow, precio, fecha, producto, cantidadvinculada FROM ceesa_cee_certificados_ventas_internos WHERE numerodocumento = 'CI-0001-00000023'")
cols = [desc[0] for desc in cur.description]
rows = cur.fetchall()
print("COLUMNS:")
print(cols)
print("\nDATA:")
for r in rows:
    print(r)
cur.close()
conn.close()
