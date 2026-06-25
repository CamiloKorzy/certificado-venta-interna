import pandas as pd

file_path = r"c:\Datos\Proyectos IT\Certificado_Venta_Interna\Documentos\Resultado Seguridad Activos Abril .xlsx"

def read():
    print("Reading Tarifa Equipo sheet...")
    df = pd.read_excel(file_path, sheet_name="Tarifa Equipo")
    # Search for rows containing MD0001
    matching_rows = df[df.astype(str).apply(lambda x: x.str.contains("MD0001", case=False)).any(axis=1)]
    print("Matching rows:")
    pd.set_option('display.max_columns', None)
    print(matching_rows)

if __name__ == '__main__':
    read()
