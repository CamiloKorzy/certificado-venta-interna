import pandas as pd

file_path = r"c:\Datos\Proyectos IT\Certificado_Venta_Interna\Documentos\Resultado Seguridad Activos Abril .xlsx"

def read():
    df = pd.read_excel(file_path, sheet_name="Tarifa Equipo")
    print("Columns:")
    print(df.columns.tolist())
    print("\nFirst 5 rows:")
    print(df.head(10))

if __name__ == '__main__':
    read()
