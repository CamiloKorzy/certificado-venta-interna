import json
import re

def update_main():
    with open('backend/main.py', 'r', encoding='utf-8') as f:
        content = f.read()

    new_endpoints = """
# ==========================================
# PROYECTO INFORME DE GESTIÓN (SNAPSHOTS)
# ==========================================

class InformeAction(BaseModel):
    unidad_negocio: str
    periodo: str
    usuario: str

@app.get("/api/informes/estado")
def get_informe_estado(unidad_negocio: str, periodo: str):
    try:
        conn = get_supabase()
        cur = conn.cursor()
        cur.execute(\"\"\"
            SELECT estado, usuario_apertura, fecha_apertura, usuario_cierre, fecha_cierre 
            FROM cert_informes_proyecto 
            WHERE unidad_negocio = %s AND periodo = %s
        \"\"\", (unidad_negocio, periodo))
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if row:
            return {
                "existe": True,
                "estado": row[0],
                "usuario_apertura": row[1],
                "fecha_apertura": row[2].isoformat() if row[2] else None,
                "usuario_cierre": row[3],
                "fecha_cierre": row[4].isoformat() if row[4] else None
            }
        else:
            return {
                "existe": False,
                "estado": "NO_INICIADO"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/informes/iniciar")
def iniciar_informe(action: InformeAction):
    try:
        conn = get_supabase()
        cur = conn.cursor()
        cur.execute(\"\"\"
            INSERT INTO cert_informes_proyecto (unidad_negocio, periodo, estado, usuario_apertura)
            VALUES (%s, %s, 'ABIERTO', %s)
            ON CONFLICT (unidad_negocio, periodo) DO NOTHING
        \"\"\", (action.unidad_negocio, action.periodo, action.usuario))
        conn.commit()
        cur.close()
        conn.close()
        return {"message": "Informe iniciado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/informes/cerrar")
def cerrar_informe(action: InformeAction):
    try:
        # Extraer snapshot de todos los módulos!
        ingresos_data = get_informe_mensual_ingresos(action.unidad_negocio, action.periodo)
        rrhh_data = get_rrhh(action.unidad_negocio, action.periodo)
        gastos_data = get_gastos(action.unidad_negocio, action.periodo, action.periodo)
        asientos_data = get_asientos(action.unidad_negocio, action.periodo)
        totales_data = get_informe_totales(action.unidad_negocio, action.periodo)

        snapshot = {
            "ingresos": ingresos_data,
            "rrhh": rrhh_data,
            "gastos": gastos_data,
            "asientos": asientos_data,
            "totales": totales_data
        }

        import json
        snapshot_json = json.dumps(snapshot)

        conn = get_supabase()
        cur = conn.cursor()
        cur.execute(\"\"\"
            UPDATE cert_informes_proyecto
            SET estado = 'CERRADO',
                usuario_cierre = %s,
                fecha_cierre = CURRENT_TIMESTAMP,
                snapshot_data = %s
            WHERE unidad_negocio = %s AND periodo = %s
        \"\"\", (action.usuario, snapshot_json, action.unidad_negocio, action.periodo))
        
        if cur.rowcount == 0:
            cur.close()
            conn.close()
            raise Exception("No se encontró el informe abierto. Primero inícielo.")
            
        conn.commit()
        cur.close()
        conn.close()
        return {"message": "Informe cerrado correctamente. Snapshot guardado."}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/informes/reabrir")
def reabrir_informe(action: InformeAction):
    try:
        # Aqui se podria verificar si el usuario es Admin.
        # Por ahora lo controlaremos en Frontend (solo Admin ve el boton).
        conn = get_supabase()
        cur = conn.cursor()
        cur.execute(\"\"\"
            UPDATE cert_informes_proyecto
            SET estado = 'ABIERTO',
                usuario_cierre = NULL,
                fecha_cierre = NULL,
                snapshot_data = NULL
            WHERE unidad_negocio = %s AND periodo = %s
        \"\"\", (action.unidad_negocio, action.periodo))
        conn.commit()
        cur.close()
        conn.close()
        return {"message": "Informe reabierto correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

"""

    # We need to prepend the new_endpoints right before the end of the file or before app.get("/api/ingresos")
    # Let's just put it at the very end of the file.
    
    if "PROYECTO INFORME DE GESTIÓN" not in content:
        content += "\n" + new_endpoints
        with open('backend/main.py', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Added new endpoints")
    else:
        print("Endpoints already added")

if __name__ == '__main__':
    update_main()
