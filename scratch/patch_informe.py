import os

path = 'frontend/src/components/InformeGestion.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Replace Gastos with Costos across the board
c = c.replace('Total Gastos', 'Total Costos')
c = c.replace('Gastos por Rubro', 'Costos por Rubro')
c = c.replace('Detalle de Gastos', 'Detalle de Costos')
c = c.replace('No hay gastos registrados', 'No hay costos registrados')
c = c.replace('No hay gastos detallados', 'No hay costos detallados')
c = c.replace('exportGastosToxlsx', 'exportCostosToxlsx')
c = c.replace("mode === 'gastos'", "mode === 'costos'")
c = c.replace("mode?: 'dashboard' | 'gastos' | 'asientos' | 'rrhh'", "mode?: 'dashboard' | 'costos' | 'asientos' | 'rrhh'")

# 2. Add lucide-react imports for buttons
if 'UploadCloud' not in c:
    c = c.replace(
        "import { Download, Search } from 'lucide-react';",
        "import { Download, Search, UploadCloud, Loader2 } from 'lucide-react';"
    )

# 3. Inject states and handlers
state_injection = """  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, tipoMovimiento: 'INGRESO' | 'COSTO') => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    setUploadMsg('');
    const formData = new FormData();
    formData.append("file", file);
    formData.append("unidad", unidad);
    formData.append("periodo", periodoStr);
    formData.append("tipo", tipoMovimiento);

    try {
      const res = await fetch('/api/config/ajustes-excel', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      const json = await res.json();
      if (json.status === 'ok') {
        setUploadMsg(`✅ Importado exitosamente (${json.inserted} filas)`);
        setTimeout(() => setUploadMsg(''), 5000);
        // Refresh component state or dashboard here if possible
      } else {
        setUploadMsg(`⚠️ Importado con errores. ${json.inserted} filas creadas.`);
      }
    } catch(err: any) {
      setUploadMsg('❌ Error al subir: ' + err.message);
    }
    setUploading(false);
    e.target.value = '';
  };
"""

if "const [uploading, setUploading]" not in c:
    c = c.replace(
        "const [loading, setLoading] = useState(false);",
        "const [loading, setLoading] = useState(false);\n" + state_injection
    )

# 4. Inject buttons for Costos
button_costos_html = """              {mode === 'costos' && data && (
                <div className="flex gap-2 relative">
                  <button onClick={exportCostosToxlsx} className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 transition flex items-center gap-2">
                    <Download size={16} /> Exportar XLSX
                  </button>
                  <input type="file" id="upload-costos" className="hidden" accept=".xlsx,.xls" onChange={(e) => handleFileUpload(e, 'COSTO')} />
                  <label htmlFor="upload-costos" className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition flex items-center gap-2 cursor-pointer">
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />} Importar adicionales de Costos
                  </label>
                  {uploadMsg && <span className="absolute top-full mt-1 right-0 text-xs font-medium bg-white px-2 py-1 shadow-sm rounded text-slate-700 whitespace-nowrap z-50">{uploadMsg}</span>}
                </div>
              )}"""

old_button_gastos = """              {mode === 'costos' && data && (
                <button onClick={exportCostosToxlsx} className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 transition flex items-center gap-2">
                  <Download size={16} /> Exportar XLSX
                </button>
              )}"""

if "Importar adicionales de Costos" not in c:
    c = c.replace(old_button_gastos, button_costos_html)

# 5. Inject buttons for Ingresos
button_ingresos_html = """              {mode === 'dashboard' && data && (
                <div className="flex gap-2 relative">
                  <button onClick={exportIngresosToxlsx} className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition flex items-center gap-2">
                    <Download size={16} /> Exportar XLSX
                  </button>
                  <input type="file" id="upload-ingresos" className="hidden" accept=".xlsx,.xls" onChange={(e) => handleFileUpload(e, 'INGRESO')} />
                  <label htmlFor="upload-ingresos" className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition flex items-center gap-2 cursor-pointer">
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />} Importar adicionales de Ingresos
                  </label>
                  {uploadMsg && <span className="absolute top-full mt-1 right-0 text-xs font-medium bg-white px-2 py-1 shadow-sm rounded text-slate-700 whitespace-nowrap z-50">{uploadMsg}</span>}
                </div>
              )}"""

old_button_ingresos = """              {mode === 'dashboard' && data && (
                <div className="flex gap-2">
                  <button onClick={exportIngresosToxlsx} className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition flex items-center gap-2">
                    <Download size={16} /> Exportar Ingresos (XLSX)
                  </button>
                </div>
              )}"""

# If the old button is slightly different:
old_button_ingresos_2 = """              {mode === 'dashboard' && data && (
                <button onClick={exportIngresosToxlsx} className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition flex items-center gap-2">
                  <Download size={16} /> Exportar XLSX
                </button>
              )}"""

if "Importar adicionales de Ingresos" not in c:
    if old_button_ingresos in c:
        c = c.replace(old_button_ingresos, button_ingresos_html)
    elif old_button_ingresos_2 in c:
        c = c.replace(old_button_ingresos_2, button_ingresos_html)

# Ensure data.gastos exists, wait, data.gastos was used instead of data.costos
# We didn't change the backend JSON format so it's still data.gastos

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print("Patch applied successfully")
