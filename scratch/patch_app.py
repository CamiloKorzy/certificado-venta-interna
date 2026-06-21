import re
import os

def patch_app():
    path = 'frontend/src/App.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    # Add imports
    if 'UploadCloud' not in c:
        c = c.replace(
            "import { Building2, PackageCheck",
            "import { UploadCloud, Building2, PackageCheck"
        )

    # Add states to Dashboard component (which is the Ingresos tab)
    # The Dashboard signature is `function Dashboard({ token, onLogout...`
    state_injection = """  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    setUploadMsg('');
    const formData = new FormData();
    formData.append("file", file);
    formData.append("unidad_negocio", appliedFilters.empresa.includes('Todas') ? (defaultUnidad || '') : appliedFilters.empresa[0]);
    formData.append("periodo", appliedFilters.periodo.includes('Todos') ? currentPeriod : appliedFilters.periodo[0]);
    formData.append("tipo", "INGRESO");

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
        // Recargar datos
        apiFetch('/api/indicadores', token)
          .then(res_json => {
            setRawData(res_json.data || []);
            setColumns(res_json.columns || []);
          });
      } else {
        setUploadMsg(`⚠️ Importado con errores. ${json.inserted} filas creadas.`);
      }
    } catch(err: any) {
      setUploadMsg('❌ Error al subir: ' + err.message);
    }
    setUploading(false);
    e.target.value = '';
  };

  const [expandedRows, setExpandedRows]"""

    if "const [uploading, setUploading]" not in c:
        c = c.replace("  const [expandedRows, setExpandedRows]", state_injection)

    # Add button next to Descargar XLSX
    # Search for:
    button_html = """                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                <Download size={14} />
                Descargar XLSX
              </button>
              
              <div className="relative">
                <input type="file" id="upload-ingresos" className="hidden" accept=".xlsx,.xls" onChange={handleFileUpload} />
                <label htmlFor="upload-ingresos" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer">
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                  Importar adicionales de Ingresos
                </label>
                {uploadMsg && <span className="absolute top-full mt-1 right-0 text-xs font-medium bg-white px-2 py-1 shadow-sm rounded text-slate-700 whitespace-nowrap z-50">{uploadMsg}</span>}
              </div>"""
    
    if "Importar adicionales de Ingresos" not in c:
        c = c.replace(
            """                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                <Download size={14} />
                Descargar XLSX
              </button>""",
            button_html
        )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)

patch_app()
