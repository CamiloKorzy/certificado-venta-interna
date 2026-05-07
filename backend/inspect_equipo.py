import pandas as pd
excel_path = r"C:\Datos\Proyectos IT\Certificado_Venta_Interna\Documentos\Detalle de Certificados de Ventas Generados.xlsx"
df = pd.read_excel(excel_path)
print("Dim. valor sample:", df['Dim. valor'].dropna().unique()[:5] if 'Dim. valor' in df.columns else 'Not found')
print("Solicitante in DB?")
import psycopg2
conn = psycopg2.connect(
    host="infraestructura-aurora-datawarehouse-instance-zxhlvevffc1c.cijt7auhxunw.us-east-1.rds.amazonaws.com",
    port="5432",
    database="finnegansbi",
    user="ceesauser",
    password="Lula$$2014",
    sslmode="require"
)
cur = conn.cursor()
cur.execute("SELECT DISTINCT solicitante FROM ceesa_cee_certificados_ventas_internos WHERE solicitante IS NOT NULL LIMIT 5;")
print("Solicitantes DB:", [x[0] for x in cur.fetchall()])
conn.close()
