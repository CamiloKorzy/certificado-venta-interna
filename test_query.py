import pyodbc
import pandas as pd

def explore():
    conn_str = 'DRIVER={SQL Server};SERVER=192.168.74.50;DATABASE=APN;UID=metabase;PWD=metabase$$2025'
    try:
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        # Look for tables/views containing "Certificado" or "Venta"
        cursor.execute("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%Certificado%' OR TABLE_NAME LIKE '%Ventas_Internos%'")
        tables = cursor.fetchall()
        print("Tables/Views found:", [t[0] for t in tables])
        
        # Try to query CEE_Certificado_Ventas_Internos
        try:
            df = pd.read_sql("SELECT TOP 5 * FROM CEE_Certificado_Ventas_Internos", conn)
            print("Schema for CEE_Certificado_Ventas_Internos:")
            print(df.dtypes)
            print("Sample Data:")
            print(df.head())
        except Exception as e:
            print("Error querying CEE_Certificado_Ventas_Internos:", e)
            
    except Exception as e:
        print("Connection Error:", e)

if __name__ == '__main__':
    explore()
