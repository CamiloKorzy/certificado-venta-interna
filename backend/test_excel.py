import pandas as pd
excel_path = r"C:\Datos\Proyectos IT\Certificado_Venta_Interna\Documentos\Detalle de Certificados de Ventas Generados.xlsx"
df = pd.read_excel(excel_path)
print("Columnas en Excel:")
print(list(df.columns))
