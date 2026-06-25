import re

with open(r'c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend\main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# remove class BulkDeleteReq
old_class = """class BulkDeleteReq(BaseModel):
    ids: List[int]"""
content = content.replace(old_class, "")

# insert it before delete_ajustes_excel_bulk
target = """@app.delete("/api/config/ajustes-excel/bulk")
def delete_ajustes_excel_bulk(req: BulkDeleteReq, current_user = Depends(get_current_user)):"""

new_target = old_class + "\n\n" + target
content = content.replace(target, new_target)

with open(r'c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend\main.py', 'w', encoding='utf-8') as f:
    f.write(content)
