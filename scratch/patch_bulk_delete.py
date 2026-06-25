import re

with open(r'c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend\main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add BulkDeleteReq
class_req = """class BulkDeleteReq(BaseModel):
    ids: list[int]

"""
content = content.replace("class ConfigItem(BaseModel):", class_req + "class ConfigItem(BaseModel):")

# Add bulk delete endpoint
bulk_delete_code = """
@app.delete("/api/config/ajustes-excel/bulk")
def delete_ajustes_excel_bulk(req: BulkDeleteReq, current_user = Depends(get_current_user)):
    conn_supa = get_supabase()
    cur_supa = conn_supa.cursor()
    if not req.ids:
        return {"status": "ok"}
    
    format_strings = ','.join(['%s'] * len(req.ids))
    cur_supa.execute(f"DELETE FROM cert_ajustes_excel WHERE id IN ({format_strings})", tuple(req.ids))
    conn_supa.commit()
    cur_supa.close()
    conn_supa.close()
    return {"status": "ok"}
"""

content = content.replace('@app.get("/api/finnegans/empresas")', bulk_delete_code + '\n@app.get("/api/finnegans/empresas")')

with open(r'c:\Datos\Proyectos IT\Certificado_Venta_Interna\backend\main.py', 'w', encoding='utf-8') as f:
    f.write(content)
