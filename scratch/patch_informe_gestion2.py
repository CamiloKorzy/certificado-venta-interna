import re

with open(r'c:\Datos\Proyectos IT\Certificado_Venta_Interna\frontend\src\components\InformeGestion.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("fetchData();", "loadInforme();")

download_template_logic = """
  const downloadTemplate = (tipo: string) => {
    const ws_data = [
      ['Concepto', 'Categoría', 'Importe', 'Observaciones']
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wscols = [{wch:30}, {wch:20}, {wch:15}, {wch:40}];
    ws['!cols'] = wscols;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Ajustes");
    XLSX.writeFile(wb, `Plantilla_Ajustes_${tipo}.xlsx`);
  };
"""

target = "const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, tipoMovimiento: 'INGRESO' | 'COSTO') => {"

content = content.replace(target, download_template_logic + "\n  " + target)

with open(r'c:\Datos\Proyectos IT\Certificado_Venta_Interna\frontend\src\components\InformeGestion.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
