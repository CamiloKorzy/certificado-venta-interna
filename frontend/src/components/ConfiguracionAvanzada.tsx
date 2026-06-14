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

export default function ConfiguracionAvanzada({ token, tipo }: { token: string, tipo: 'ingresos' | 'gastos-asientos' | 'gastos-compras' | 'ajustes-excel' }) {
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [selectedSucursal, setSelectedSucursal] = useState<string>('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maestro, setMaestro] = useState<any[]>([]);
  const [saveMsg, setSaveMsg] = useState('');
  

  // Excel State
  const [uploads, setUploads] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, [tipo]);

  useEffect(() => {
    if (tipo !== 'ajustes-excel' && selectedSucursal) {
      loadConfigForSucursal(selectedSucursal);
    }
  }, [selectedSucursal]);

  const loadConfigForSucursal = async (suc: string) => {
    setLoading(true);
    try {
      const endpoint = tipo === 'ingresos' ? 'ingresos-comprobantes' : tipo;
      const configRes = await apiFetch(`/api/config/avanzada/${endpoint}/${encodeURIComponent(suc)}`, token);
      setItems(configRes || []);
    } catch (e) {
      console.error(e);
      setItems([]);
    }
    setLoading(false);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (tipo === 'ajustes-excel') {
        const upRes = await apiFetch('/api/config/ajustes-excel', token);
        setUploads(upRes || []);
      } else {
        const [sucRes, maestroRes] = await Promise.all([
          apiFetch('/api/unidades-negocio', token),
          tipo === 'ingresos' ? apiFetch('/api/finnegans/subtipos', token) :
          tipo === 'gastos-asientos' ? apiFetch('/api/finnegans/categorias-asiento', token) :
          apiFetch('/api/finnegans/subtipos', token)
        ]);
        
        const sucursalesData = sucRes?.data || (Array.isArray(sucRes) ? sucRes : []);
        setSucursales(sucursalesData);
        setMaestro(maestroRes || []);

        let activeSuc = selectedSucursal;
        if (!activeSuc && sucursalesData.length > 0) {
          activeSuc = sucursalesData[0].sucursal;
          setSelectedSucursal(activeSuc);
        }

        if (activeSuc) {
          const endpoint = tipo === 'ingresos' ? 'ingresos-comprobantes' : tipo;
          const configRes = await apiFetch(`/api/config/avanzada/${endpoint}/${encodeURIComponent(activeSuc)}`, token);
          setItems(configRes || []);
        } else {
          setItems([]);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSaveSimples = async () => {
    if (!selectedSucursal) return;
    setSaving(true);
    try {
      const endpoint = tipo === 'ingresos' ? 'ingresos-comprobantes' : tipo;
      await apiFetch(`/api/config/avanzada/${endpoint}/${encodeURIComponent(selectedSucursal)}`, token, {
        method: 'POST',
        body: JSON.stringify(items)
      });
      setSaveMsg('✅ Guardado exitosamente');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e: any) {
      console.error(e);
      setSaveMsg(`❌ Error al guardar: ${e.message || e}`);
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
      const res = await fetch(API_URL + '/api/config/ajustes-excel', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      
      const data = await res.json();
      
      if (data.status === 'ok') {
        setSaveMsg('✅ Archivo procesado correctamente.');
      } else {
        setSaveMsg(`⚠️ Importado con errores. ${data.inserted} filas creadas.`);
        console.error("Errores:", data.errors);
      }
      
      if (data.suggestions && Object.keys(data.suggestions).length > 0) {
        alert("Se aplicaron correcciones automáticas de nombres de Unidades de Negocio:\n\n" + 
              Object.entries(data.suggestions).map(([k, v]) => `'${k}' -> '${v}'`).join("\n"));
      }
      if (data.errors && data.errors.length > 0) {
        alert("Se encontraron errores al importar algunas filas:\n\n" + data.errors.join("\n"));
      }

      setTimeout(() => setSaveMsg(''), 5000);
      loadData(); // reload list
    } catch (err: any) {
      console.error(err);
      setSaveMsg('❌ Error al subir: ' + err.message);
    }
    setUploading(false);
    e.target.value = ''; // reset input
  };

  const deleteUpload = async (id: number) => {
    if (!confirm('¿Eliminar este ajuste?')) return;
    try {
      await apiFetch(`/api/config/ajustes-excel/${id}`, token, { method: 'DELETE' });
      loadData();
    } catch (e) {
      console.error(e);
      alert('Error al eliminar');
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 size={24} className="animate-spin text-blue-600" /></div>;


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
            Sube un archivo Excel (.xlsx) con las columnas en este orden: <strong>Unidad de Negocio, Periodo (MM/AAAA), Concepto, Tipo (INGRESO/GASTO), Categoría, Importe, Observaciones</strong>.
          </p>
          <label className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} 
            Seleccionar Archivo
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
          </label>
          {saveMsg && <p className={`mt-3 text-sm font-bold ${saveMsg.includes('✅') ? 'text-emerald-600' : 'text-red-600'}`}>{saveMsg}</p>}
        </div>

        <div>
          <h4 className="font-bold text-slate-800 mb-4">Últimos Registros Importados</h4>
          <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 font-bold text-slate-600">Fecha Carga</th>
                  <th className="text-left px-5 py-3 font-bold text-slate-600">Unidad de Negocio</th>
                  <th className="text-left px-5 py-3 font-bold text-slate-600">Periodo</th>
                  <th className="text-left px-5 py-3 font-bold text-slate-600">Tipo</th>
                  <th className="text-left px-5 py-3 font-bold text-slate-600">Concepto</th>
                  <th className="text-right px-5 py-3 font-bold text-slate-600">Importe</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {uploads.map(u => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-5 py-3 text-slate-500">{new Date(u.fecha_carga).toLocaleString('es-AR')}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{u.unidad_negocio}</td>
                    <td className="px-5 py-3 text-slate-600">{u.periodo}</td>
                    <td className="px-5 py-3 text-slate-600">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${u.tipo_movimiento === 'INGRESO' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {u.tipo_movimiento}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 truncate max-w-[200px]" title={u.concepto}>{u.concepto}</td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-800">
                      ${u.importe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => deleteUpload(u.id)} className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {uploads.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">No hay ajustes importados.</td></tr>
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
    'ingresos': 'Conf. Ingresos',
    'gastos-asientos': 'Conf. Asientos',
    'gastos-compras': 'Conf. Gastos Compras'
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <h3 className="font-bold text-slate-800 text-lg">{titleMap[tipo]}</h3>
      </div>
      
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
        
        <div className="flex flex-col gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Seleccionar Sucursal</label>
            <select 
              value={selectedSucursal}
              onChange={(e) => setSelectedSucursal(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white transition-colors"
            >
              {(sucursales || []).map((s, idx) => (
                <option key={s?.sucursal || idx} value={s?.sucursal || ''}>{s?.sucursal || 'Sin nombre'}</option>
              ))}
            </select>
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
