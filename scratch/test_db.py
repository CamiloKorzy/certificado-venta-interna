import psycopg2
conn = psycopg2.connect('postgresql://postgres.csvgvzhokgbuxmlqumur:Lula$$2014$$@aws-1-us-east-1.pooler.supabase.com:5432/postgres')
cur = conn.cursor()
cur.execute("SELECT empresa, cliente, total, gravado FROM ceesa_cee_certificados_ventas_internas WHERE empresa = 'Seguridad de Activos' AND EXTRACT(MONTH FROM CAST(fecha AS TIMESTAMP)) = 5")
print(cur.fetchall())
cur.execute("SELECT empresa, cliente, total, gravado FROM ceesa_cee_certificados_ventas_internas WHERE empresa ILIKE '%Seguridad%' AND EXTRACT(MONTH FROM CAST(fecha AS TIMESTAMP)) = 5")
print(cur.fetchall())
