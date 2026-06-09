import psycopg2
import os

conn=psycopg2.connect(host='ceesa.dw.finneg.com', port=5432, dbname='finnegansbi', user='ceesauser', password='Lula$$2014')
cur=conn.cursor()
cur.execute("SELECT documento, comprobante, operacionitemid FROM ceesa_cee_certificados_ventas_internas WHERE empresa='Seguridad de Activos' LIMIT 5")
print(cur.fetchall())
