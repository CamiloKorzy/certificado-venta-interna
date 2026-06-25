import re

with open(r'c:\Datos\Proyectos IT\Certificado_Venta_Interna\frontend\src\components\InformeGestion.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add states for selection
state_logic = """
  const [selectedAjustes, setSelectedAjustes] = useState<Set<number>>(new Set());
  
  const handleSelectAjuste = (id: number) => {
    const newSet = new Set(selectedAjustes);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedAjustes(newSet);
  };
  
  const handleSelectAllAjustes = () => {
    const ajustes = data.gastos.filter((c: any) => c.origen === 'AJUSTE EXCEL' && c.id_ajuste);
    if (selectedAjustes.size === ajustes.length && ajustes.length > 0) {
      setSelectedAjustes(new Set());
    } else {
      setSelectedAjustes(new Set(ajustes.map((c: any) => c.id_ajuste)));
    }
  };
  
  const handleDeleteSelected = async () => {
    if (selectedAjustes.size === 0) return;
    if (!confirm(`¿Eliminar ${selectedAjustes.size} ajustes seleccionados?`)) return;
    
    setUploading(true);
    try {
      await fetch('/api/config/ajustes-excel/bulk', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedAjustes) })
      });
      setSelectedAjustes(new Set());
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Error eliminando ajustes');
    } finally {
      setUploading(false);
    }
  };
"""

content = content.replace("const [uploading, setUploading] = useState(false);", "const [uploading, setUploading] = useState(false);\n" + state_logic)

# Add downloadTemplate logic
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

content = content.replace("const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, tipoMovimiento: string) => {", download_template_logic + "\n  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, tipoMovimiento: string) => {")

# Add "Eliminar Seleccionados" and "Descargar Plantilla" button to UI
buttons_ui = """
                  {selectedAjustes.size > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
                    >
                      <Trash2 size={14} />
                      Eliminar seleccionados ({selectedAjustes.size})
                    </button>
                  )}
                  <button
                    onClick={() => downloadTemplate('COSTO')}
                    className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    <Download size={14} />
                    Descargar Plantilla
                  </button>
"""

content = content.replace(
    '<div className="relative">\n                    <input type="file" id="upload-costos" className="hidden" accept=".xlsx,.xls" onChange={(e) => handleFileUpload(e, \'COSTO\')} />', 
    buttons_ui + '\n                  <div className="relative">\n                    <input type="file" id="upload-costos" className="hidden" accept=".xlsx,.xls" onChange={(e) => handleFileUpload(e, \'COSTO\')} />'
)

# Update table headers
thead_old = """                      <th className="px-6 py-4 w-12 text-center"></th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">Fecha</th>"""
thead_new = """                      <th className="px-6 py-4 w-12 text-center"></th>
                      <th className="px-4 py-4 w-10 text-center bg-slate-50/50">
                        <input type="checkbox" onChange={handleSelectAllAjustes} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">Fecha</th>"""
content = content.replace(thead_old, thead_new)

# Update table body
tbody_old = """                          <tr 
                            className={`hover:bg-slate-50 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50' : ''}`}
                            onClick={() => toggleRow(gasto.comprobante)}
                          >
                            <td className="px-6 py-4 text-slate-400 text-center">
                              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </td>"""
tbody_new = """                          <tr 
                            className={`hover:bg-slate-50 transition-colors cursor-pointer ${gasto.origen === 'AJUSTE EXCEL' ? 'bg-amber-50/60' : ''} ${isExpanded ? 'bg-slate-50' : ''}`}
                            onClick={(e) => {
                              if ((e.target as HTMLElement).tagName !== 'INPUT') {
                                toggleRow(gasto.comprobante);
                              }
                            }}
                          >
                            <td className="px-6 py-4 text-slate-400 text-center">
                              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </td>
                            <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                              {gasto.origen === 'AJUSTE EXCEL' && gasto.id_ajuste && (
                                <input 
                                  type="checkbox" 
                                  checked={selectedAjustes.has(gasto.id_ajuste)}
                                  onChange={() => handleSelectAjuste(gasto.id_ajuste)}
                                  className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                />
                              )}
                            </td>"""
content = content.replace(tbody_old, tbody_new)

if "Trash2" not in content:
    content = content.replace("from 'lucide-react';", "Trash2, \nfrom 'lucide-react';")

with open(r'c:\Datos\Proyectos IT\Certificado_Venta_Interna\frontend\src\components\InformeGestion.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
