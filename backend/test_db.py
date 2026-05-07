import psycopg2

DB_HOST = "infraestructura-aurora-datawarehouse-instance-zxhlvevffc1c.cijt7auhxunw.us-east-1.rds.amazonaws.com"
DB_PORT = "5432"
DB_NAME = "finnegansbi"
DB_USER = "ceesauser"
DB_PASS = "Lula$$2014"

conn = psycopg2.connect(
    host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASS, sslmode="require"
)
cur = conn.cursor()
cur.execute("SELECT DISTINCT estadoautorizacion FROM ceesa_cee_certificados_ventas_internos;")
estados = cur.fetchall()
print("Estados:")
for e in estados:
    print(e)
conn.close()
