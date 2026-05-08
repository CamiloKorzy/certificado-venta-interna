import psycopg2
import os
import json

conn = psycopg2.connect(host='infraestructura-aurora-datawarehouse-instance-zxhlvevffc1c.cijt7auhxunw.us-east-1.rds.amazonaws.com', port='5432', database='finnegansbi', user='ceesauser', password='Lula$$2014', sslmode='require')
cur = conn.cursor()
cur.execute('SELECT * FROM ceesa_cee_certificados_ventas_internos LIMIT 5')
cols = [desc[0] for desc in cur.description]
rows = cur.fetchall()
print("COLUMNS:")
print(cols)
print("\nDATA:")
for r in rows:
    print(r)
cur.close()
conn.close()
