import re

def update_getters():
    with open('backend/main.py', 'r', encoding='utf-8') as f:
        content = f.read()

    helper = """
def check_informe_cerrado(empresa: str, periodo: str, modulo: str):
    try:
        if not empresa or not periodo: return None
        conn = get_supabase()
        cur = conn.cursor()
        cur.execute("SELECT estado, snapshot_data FROM cert_informes_proyecto WHERE unidad_negocio = %s AND periodo = %s", (empresa, periodo))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row and row[0] == 'CERRADO' and row[1]:
            return row[1].get(modulo)
    except:
        pass
    return None
"""

    if "def check_informe_cerrado" not in content:
        # insert it after imports
        start_idx = content.find("app = FastAPI")
        content = content[:start_idx] + helper + "\n" + content[start_idx:]

    # For each getter, we add the short-circuit:
    # 1. get_informe_mensual_ingresos
    # 2. get_rrhh
    # 3. get_gastos
    # 4. get_asientos
    # 5. get_informe_totales

    patches = [
        (
            "def get_informe_mensual_ingresos(\n    empresa: Optional[str] = None,\n    periodo: Optional[str] = None\n):\n    try:",
            "def get_informe_mensual_ingresos(\n    empresa: Optional[str] = None,\n    periodo: Optional[str] = None\n):\n    try:\n        cerrado = check_informe_cerrado(empresa, periodo, 'ingresos')\n        if cerrado is not None: return cerrado"
        ),
        (
            "def get_rrhh(\n    empresa: Optional[str] = None,\n    periodo: Optional[str] = None\n):\n    try:",
            "def get_rrhh(\n    empresa: Optional[str] = None,\n    periodo: Optional[str] = None\n):\n    try:\n        cerrado = check_informe_cerrado(empresa, periodo, 'rrhh')\n        if cerrado is not None: return cerrado"
        ),
        (
            "def get_gastos(\n    empresa: Optional[str] = None,\n    fecha_desde: Optional[str] = None,\n    fecha_hasta: Optional[str] = None\n):\n    try:",
            "def get_gastos(\n    empresa: Optional[str] = None,\n    fecha_desde: Optional[str] = None,\n    fecha_hasta: Optional[str] = None\n):\n    try:\n        # Asumimos que fecha_desde y fecha_hasta son el mismo periodo para el cierre\n        cerrado = check_informe_cerrado(empresa, fecha_desde, 'gastos')\n        if cerrado is not None: return cerrado"
        ),
        (
            "def get_asientos(\n    unidad_negocio: Optional[str] = None,\n    periodo: Optional[str] = None\n):\n    try:",
            "def get_asientos(\n    unidad_negocio: Optional[str] = None,\n    periodo: Optional[str] = None\n):\n    try:\n        cerrado = check_informe_cerrado(unidad_negocio, periodo, 'asientos')\n        if cerrado is not None: return cerrado"
        ),
        (
            "def get_informe_totales(\n    empresa: Optional[str] = None,\n    periodo: Optional[str] = None\n):\n    try:",
            "def get_informe_totales(\n    empresa: Optional[str] = None,\n    periodo: Optional[str] = None\n):\n    try:\n        cerrado = check_informe_cerrado(empresa, periodo, 'totales')\n        if cerrado is not None: return cerrado"
        )
    ]

    for old, new in patches:
        content = content.replace(old, new)

    with open('backend/main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Getters patched.")

if __name__ == '__main__':
    update_getters()
