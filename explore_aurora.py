import psycopg2
import pandas as pd

DB_HOST = "infraestructura-aurora-datawarehouse-instance-zxhlvevffc1c.cijt7auhxunw.us-east-1.rds.amazonaws.com"
DB_PORT = "5432"
DB_NAME = "finnegansbi"
DB_USER = "ceesauser"
DB_PASS = "Lula$$2014"

def explore():
    try:
        conn = psycopg2.connect(
            host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASS, sslmode="require"
        )
        print("Conectado a Aurora DW exitosamente.")
        
        # Buscar el nombre exacto de la tabla/vista
        query = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE lower(table_name) LIKE '%certificado%' OR lower(table_name) LIKE '%venta%'
        """
        df = pd.read_sql(query, conn)
        print("Tablas encontradas con 'certificado' o 'venta':")
        print(df['table_name'].tolist())
        
    except Exception as e:
        print("Error:", e)
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == '__main__':
    explore()
