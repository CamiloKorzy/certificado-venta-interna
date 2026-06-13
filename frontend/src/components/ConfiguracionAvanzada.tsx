import React, { useEffect, useState } from 'react';
import { Save, Check, Loader2, X, Plus, Trash2, Edit2, UploadCloud, FileText } from 'lucide-react';

const API_URL = '';
function apiFetch(path: string, token: string, options: any = {}) {
  return fetch(API_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    }
  }).then(async res => {
    if (res.status === 401) { localStorage.removeItem('cert_token'); window.location.reload(); }
    if (!res.ok) { const t = await res.text(); throw new Error(`HTTP ${res.status}: ${t}`); }
    return res.json();
  });
}

export default function ConfiguracionAvanzada({ token, tipo }: { token: string, tipo: 'ingresos' | 'gastos-asientos' | 'gastos-compras' | 'unidades' | 'ajustes-excel' }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maestro, setMaestro] = useState<any[]>([]);
  const [saveMsg, setSaveMsg] = useState('');
  
  // Unidades de Negocio Specific State
  const [unidades, setUnidades] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [centros, setCentros] = useState<any[]>([]);
  const [nuevaUnidad, setNuevaUnidad] = useState('');

  // Excel State
  const [uploads, setUploads] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, [tipo]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tipo === 'unidades') {
        const [uns, sucs, ccs] = await Promise.all([
          apiFetch('/api/config/unidades-negocio', token),
          apiFetch('/api/finnegans/empresas', token),
          apiFetch('/api/finnegans/centros-costo', token)
        ]);
        setUnidades(uns || []);
        setSucursales(sucs || []);
        setCentros(ccs || []);
      } else if (tipo === 'ajustes-excel') {
        const upRes = await apiFetch('/api/excel/uploads', token);
        setUploads(upRes || []);
      } else {
        const [configRes, maestroRes] = await Promise.all([
          apiFetch(`/api/config/avanzada/${tipo === 'ingresos' ? 'ingresos-comprobantes' : tipo}`, token),
          tipo === 'ingresos' ? apiFetch('/api/finnegans/subtipos', token) :
          tipo === 'gastos-asientos' ? apiFetch('/api/finnegans/categorias-asiento', token) :
          apiFetch('/api/finnegans/subtipos', token)
        ]);
        setItems(configRes || []);
        setMaestro(maestroRes || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSaveSimples = async () => {
    setSaving(true);
    try {
      const endpoint = tipo === 'ingresos' ? 'ingresos-comprobantes' : tipo;
      await apiFetch(`/api/config/avanzada/${endpoint}`, token, {
        method: 'POST',
        body: JSON.stringify(items)
      });
      setSaveMsg('✅ Guardado exitosamente');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e) {
      console.error(e);
      setSaveMsg('❌ Error al guardar');
    }
    setSaving(false);
  };

  const handleSaveUnidades = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/config/unidades-negocio`, token, {
        method: 'POST',
        body: JSON.stringify(unidades)
      });
      setSaveMsg('✅ Unidades guardadas');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e) {
      console.error(e);
      setSaveMsg('❌ Error al guardar unidades');
    }
    setSaving(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch(API_URL + '/api/excel/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      
      setSaveMsg('✅ Archivo subido y procesado');
      setTimeout(() => setSaveMsg(''), 3000);
      loadData(); // reload list
    } catch (err: any) {
      console.error(err);
      setSaveMsg('❌ Error al subir: ' + err.message);
    }
    setUploading(false);
    e.target.value = ''; // reset input
  };

  const deleteUpload = async (id: number) => {
    if (!confirm('¿Eliminar esta subida y todos sus registros asociados?')) return;
    try {
      await apiFetch(`/api/excel/uploads/${id}`, token, { method: 'DELETE' });
      loadData();
    } catch (e) {
      console.error(e);
      alert('Error al eliminar');
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 size={24} className="animate-spin text-blue-600" /></div>;

  if (tipo === 'unidades') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg">Estructura de Unidades de Negocio</h3>
          <div className="flex items-center gap-2">
            <input 
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm" 
              placeholder="Nueva Unidad..." 
              value={nuevaUnidad} 
              onChange={e => setNuevaUnidad(e.target.value)} 
            />
            <button 
              onClick={() => { if(nuevaUnidad) { setUnidades([...unidades, { nombre: nuevaUnidad, detalles: [] }]); setNuevaUnidad(''); } }}
              className="bg-slate-800 hover:bg-slate-900 text-white p-2 rounded-lg"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {unidades.map((un, i) => (
          <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50 relative">
            <button onClick={() => setUnidades(unidades.filter((_, idx) => idx !== i))} className="absolute top-4 right-4 text-slate-400 hover:text-red-500">
              <Trash2 size={16} />
            </button>
            <h4 className="font-bold text-slate-800 mb-4">{un.nombre}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Sucursales */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sucursales (Empresas)</p>
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg bg-white p-2 space-y-1">
                  {sucursales.map(s => {
                    const isSelected = un.detalles.some((d: any) => d.tipo === 'sucursal' && d.valor_id === s.id);
                    return (
                      <label key={s.id} className="flex items-center gap-2 text-sm p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                        <input type="checkbox" checked={isSelected} onChange={(e) => {
                          const nd = [...un.detalles];
                          if (e.target.checked) nd.push({ tipo: 'sucursal', valor_id: s.id, valor_codigo: s.codigo, valor_nombre: s.nombre });
                          else { const idx = nd.findIndex(x => x.tipo === 'sucursal' && x.valor_id === s.id); if(idx>-1) nd.splice(idx, 1); }
                          const nu = [...unidades]; nu[i] = { ...nu[i], detalles: nd }; setUnidades(nu);
                        }} />
                        <span className="truncate">{s.nombre} ({s.codigo})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Centros de Costo */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Centros de Costo</p>
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg bg-white p-2 space-y-1">
                  {centros.map(c => {
                    const isSelected = un.detalles.some((d: any) => d.tipo === 'centro_costo' && d.valor_id === c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-2 text-sm p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                        <input type="checkbox" checked={isSelected} onChange={(e) => {
                          const nd = [...un.detalles];
                          if (e.target.checked) nd.push({ tipo: 'centro_costo', valor_id: c.id, valor_codigo: c.codigo, valor_nombre: c.nombre });
                          else { const idx = nd.findIndex(x => x.tipo === 'centro_costo' && x.valor_id === c.id); if(idx>-1) nd.splice(idx, 1); }
                          const nu = [...unidades]; nu[i] = { ...nu[i], detalles: nd }; setUnidades(nu);
                        }} />
                        <span className="truncate">{c.nombre} ({c.codigo})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-2 items-center pt-4 border-t border-slate-100">
          <button onClick={handleSaveUnidades} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar Estructura
          </button>
          {saveMsg && <span className={`text-sm font-medium ${saveMsg.includes('✅') ? 'text-emerald-600' : 'text-red-600'}`}>{saveMsg}</span>}
        </div>
      </div>
    );
  }

  if (tipo === 'ajustes-excel') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <FileText size={20} className="text-blue-600" /> Ajustes por Excel
        </h3>
        
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <UploadCloud size={48} className="text-blue-500 mb-3" />
          <h4 className="font-bold text-slate-800">Importar Ajustes</h4>
          <p className="text-sm text-slate-500 mb-4 max-w-md">
            Sube un archivo Excel (.xlsx) con las columnas: <strong>Unidad de Negocio, Fecha, Concepto, Tipo, Importe</strong>.
          </p>
          <label className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} 
            Seleccionar Archivo
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
          </label>
          {saveMsg && <p className={`mt-3 text-sm font-bold ${saveMsg.includes('✅') ? 'text-emerald-600' : 'text-red-600'}`}>{saveMsg}</p>}
        </div>

        <div>
          <h4 className="font-bold text-slate-800 mb-4">Archivos Subidos</h4>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 font-bold text-slate-600">Archivo</th>
                  <th className="text-left px-5 py-3 font-bold text-slate-600">Fecha de Subida</th>
                  <th className="text-left px-5 py-3 font-bold text-slate-600">Registros</th>
                  <th className="text-left px-5 py-3 font-bold text-slate-600">Estado</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {uploads.map(u => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-medium text-slate-800">{u.filename}</td>
                    <td className="px-5 py-3 text-slate-500">{new Date(u.uploaded_at).toLocaleString('es-AR')}</td>
                    <td className="px-5 py-3 font-mono text-slate-600">{u.total_registros}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                        {u.estado}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => deleteUpload(u.id)} className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {uploads.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">No hay archivos importados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Ingresos / Gastos Compras / Gastos Asientos
  const titleMap = {
    'ingresos': 'Subtipos de Comprobante para Ingresos',
    'gastos-asientos': 'Tipos de Asiento Contable para Gastos',
    'gastos-compras': 'Subtipos de Comprobante para Compras/Gastos'
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <h3 className="font-bold text-slate-800 text-lg">{titleMap[tipo]}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Seleccionar de Finnegans</p>
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
            {maestro.map(m => {
              const isSelected = items.some(i => i.id_ref === m.id);
              return (
                <label key={m.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 border-b border-slate-100 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" checked={isSelected} onChange={(e) => {
                    if (e.target.checked) setItems([...items, { id_ref: m.id, codigo: m.codigo, nombre: m.nombre }]);
                    else setItems(items.filter(i => i.id_ref !== m.id));
                  }} />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{m.nombre}</p>
                    <p className="text-xs text-slate-500 font-mono">{m.codigo}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
        
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ítems Seleccionados ({items.length})</p>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 min-h-[400px]">
            {items.length === 0 && <p className="text-sm text-slate-400 text-center mt-10">Ningún ítem seleccionado</p>}
            <ul className="space-y-2">
              {items.map((i, idx) => (
                <li key={idx} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{i.nombre}</p>
                    <p className="text-xs text-slate-500 font-mono">{i.codigo}</p>
                  </div>
                  <button onClick={() => setItems(items.filter((_, x) => x !== idx))} className="text-slate-400 hover:text-red-500 p-1">
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-2 items-center pt-4 border-t border-slate-100">
        <button onClick={handleSaveSimples} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar Configuración
        </button>
        {saveMsg && <span className={`text-sm font-medium ${saveMsg.includes('✅') ? 'text-emerald-600' : 'text-red-600'}`}>{saveMsg}</span>}
      </div>
    </div>
  );
}
