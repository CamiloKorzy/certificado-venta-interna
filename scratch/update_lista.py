import re

def update_main():
    with open('backend/main.py', 'r', encoding='utf-8') as f:
        content = f.read()

    new_endpoint = """
@app.get("/api/informes/lista")
def get_informes_lista(user=Depends(get_current_user)):
    try:
        conn = get_supabase()
        cur = conn.cursor()
        
        # Filtramos por las unidades a las que tiene acceso el usuario
        unidades_permitidas = set()
        if user.get("rol") != "admin":
            cur.execute("SELECT unidad_negocio FROM cert_usuarios_unidades WHERE usuario_id = %s", (user.get('id') or user.get('sub'),))
            unidades_permitidas = {r[0].strip() for r in cur.fetchall()}
            if not unidades_permitidas:
                cur.close()
                conn.close()
                return []
                
        if user.get("rol") == "admin":
            cur.execute("SELECT id, unidad_negocio, periodo, estado, usuario_apertura FROM cert_informes_proyecto ORDER BY periodo DESC")
        else:
            cur.execute("SELECT id, unidad_negocio, periodo, estado, usuario_apertura FROM cert_informes_proyecto WHERE unidad_negocio IN %s ORDER BY periodo DESC", (tuple(unidades_permitidas),))
            
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        result = []
        for r in rows:
            result.append({
                "id": r[0],
                "unidad_negocio": r[1],
                "periodo": r[2],
                "estado": r[3],
                "usuario_apertura": r[4]
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
"""

    if "def get_informes_lista" not in content:
        content += "\n" + new_endpoint
        with open('backend/main.py', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Endpoint get_informes_lista added.")
    else:
        print("Endpoint already exists.")

if __name__ == '__main__':
    update_main()
