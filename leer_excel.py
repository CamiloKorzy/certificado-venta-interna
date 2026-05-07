import pandas as pd
import json
import sys

try:
    df = pd.read_excel("Documentos/Certificados de Ventas Generados.xlsx")
    result = {
        "columns": list(df.columns),
        "sample": df.head(2).to_dict(orient="records")
    }
    print(json.dumps(result, default=str, indent=2))
except Exception as e:
    print(f"Error reading excel: {e}")
