import re

def update_informe():
    with open('frontend/src/components/InformeGestion.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update the loadInforme function to also fetch /api/informes/estado
    if "const fetchEstado = await fetch" not in content:
        # we will replace `setLoading(true);` with fetching state
        replacement = """
    setLoading(true);
    setError('');
    try {
      const pStr = parsePeriodo(periodoStr);
      const estadoRes = await fetch(`/api/informes/estado?unidad_negocio=${encodeURIComponent(unidad)}&periodo=${encodeURIComponent(pStr!)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (estadoRes.ok) {
        const estadoJson = await estadoRes.json();
        setEstadoCierre(estadoJson);
      }
"""
        content = content.replace("    setLoading(true);\n    setError('');\n    try {", replacement)

    # Need to add state var for estadoCierre
    if "const [estadoCierre" not in content:
        content = content.replace(
            "const [searchTermRRHH, setSearchTermRRHH] = useState('');",
            "const [searchTermRRHH, setSearchTermRRHH] = useState('');\n  const [estadoCierre, setEstadoCierre] = useState<any>(null);"
        )

    # 2. Update handlePresentar -> /api/informes/cerrar
    content = content.replace("/api/cierre/presentar", "/api/informes/cerrar")
    # Need to send "usuario: 'Usuario'" because it is required
    # But where do we get the user email? In InformeGestion we don't have it unless passed.
    # We can fetch it from localStorage here
    if "usuario: " not in content[content.find("body: JSON.stringify({"):content.find("body: JSON.stringify({")+100]:
        content = content.replace(
            "body: JSON.stringify({\n          unidad_negocio: unidad,\n          periodo: p\n        })",
            "body: JSON.stringify({\n          unidad_negocio: unidad,\n          periodo: p,\n          usuario: JSON.parse(localStorage.getItem('cert_user') || '{}')?.email || 'Usuario'\n        })"
        )

    # 3. Update handleReabrir -> /api/informes/reabrir
    content = content.replace("/api/cierre/reabrir", "/api/informes/reabrir")
    if "usuario: " not in content[content.find("body: JSON.stringify({", content.find("handleReabrir")):content.find("handleReabrir")+300]:
        content = content.replace(
            "body: JSON.stringify({\n          unidad_negocio: unidad,\n          periodo: p\n        })",
            "body: JSON.stringify({\n          unidad_negocio: unidad,\n          periodo: p,\n          usuario: JSON.parse(localStorage.getItem('cert_user') || '{}')?.email || 'Usuario'\n        })",
            1
        )

    # 4. Use estadoCierre for the UI instead of data.estado_cierre
    content = content.replace("data.estado_cierre", "estadoCierre?.estado")
    content = content.replace("data.usuario_cierre", "estadoCierre?.usuario_cierre")
    content = content.replace("data.fecha_cierre", "estadoCierre?.fecha_cierre")
    
    # Show "CERRADO" / "ABIERTO" tags based on estadoCierre instead of data
    content = content.replace("{data && (", "{estadoCierre && (")

    with open('frontend/src/components/InformeGestion.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("InformeGestion updated.")

if __name__ == '__main__':
    update_informe()
