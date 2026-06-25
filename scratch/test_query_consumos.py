import sys
import os

sys.path.append(r"c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend")
from main import get_aurora

conn = get_aurora()
cur = conn.cursor()

cur.execute("""
    SELECT 
        COUNT(*), 
        SUM(CASE WHEN importevalorizadoconsumoprod IS NULL OR importevalorizadoconsumoprod = 'NULL' OR importevalorizadoconsumoprod = '' THEN 1 ELSE 0 END) as null_count,
        SUM(CASE WHEN importevalorizadoconsumoprod IS NOT NULL AND importevalorizadoconsumoprod != 'NULL' AND importevalorizadoconsumoprod != '' THEN 1 ELSE 0 END) as non_null_count
    FROM analisis_de_consumos_de_produccion
""")
print(cur.fetchone())

cur.close()
conn.close()
