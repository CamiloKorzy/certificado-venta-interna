import React, { useEffect, useState } from 'react';
import { Save, Loader2, Check, Building2 } from 'lucide-react';

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

export default function ConfiguracionCentrosCosto({ token }: { token: string }) {
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [selectedSucursal, setSelectedSucursal] = useState<string>('');
  const [items, setItems] = useState<any[]>([]);
  const [maestro, setMaestro] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [allSelections, setAllSelections] = useState<Record<string, any[]>>({});

  useEffect(() => {
    loadSucursalesYMaestro();
  }, []);

  useEffect(() => {
    if (selectedSucursal) {
      loadItems(selectedSucursal);
    } else {
      setItems([]);
    }
  }, [selectedSucursal]);

  const loadAllSelections = async () => {
    try {
      const allRes = await apiFetch(`/api/config/centros-costo`, token);
      setAllSelections(allRes || {});
    } catch(e) {
      console.error(e);
    }
  };

  const loadSucursalesYMaestro = async () => {
    setLoading(true);
    try {
      const [sucRes, maestroRes] = await Promise.all([
        apiFetch('/api/unidades-negocio', token),
        apiFetch('/api/finnegans/centros-costo', token)
      ]);
      const sucursalesData = sucRes?.data || (Array.isArray(sucRes) ? sucRes : []);
      setSucursales(sucursalesData);
      setMaestro(Array.isArray(maestroRes) ? maestroRes : (maestroRes?.data || []));
      if (sucursalesData.length > 0) {
        setSelectedSucursal(sucursalesData[0].sucursal);
      }
      await loadAllSelections();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const loadItems = async (suc: string) => {
    setLoadingItems(true);
    try {
      const res = await apiFetch(`/api/config/centros-costo/${encodeURIComponent(suc)}`, token);
      setItems(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setItems([]);
    }
    setLoadingItems(false);
  };

  const handleSave = async () => {
    if (!selectedSucursal) return;
    setSaving(true);
    try {
      await apiFetch(`/api/config/centros-costo/${encodeURIComponent(selectedSucursal)}`, token, {
        method: 'POST',
        body: JSON.stringify(items)
      });
      setSaveMsg('✅ Guardado exitosamente');
      await loadAllSelections();
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e: any) {
      console.error(e);
      setSaveMsg(`❌ Error al guardar: ${e.message || e}`);
    }
    setSaving(false);
  };

  const isSelected = (id: any) => {
    if (!items || !Array.isArray(items)) return false;
    return items.some(i => i && String(i.id_ref) === String(id));
  };

  const toggleSelection = (m: any) => {
    if (!m) return;
    if (isSelected(m.id)) {
      setItems(items.filter(i => i && String(i.id_ref) !== String(m.id)));
    } else {
      setItems([...items, { id_ref: m.id, codigo: m.codigo, nombre: m.nombre }]);
    }
  };

  const filteredMaestro = (maestro || []).filter(m => {
    if (!m) return false;
    const nom = String(m.nombre || '').toLowerCase();
    const cod = String(m.codigo || '').toLowerCase();
    const st = String(searchTerm || '').toLowerCase();
    return nom.includes(st) || cod.includes(st);
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
        <div className="w-full md:w-1/3">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Buscar Centro de Costo</label>
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código o nombre..."
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex-1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-slate-200 rounded-xl flex flex-col h-[500px]">
          <div className="p-3 border-b border-slate-200 bg-slate-50 rounded-t-xl">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">SELECCIONAR DE FINNEGANS</h4>
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            {loading ? <div className="p-8 text-center text-slate-400 flex justify-center"><Loader2 size={24} className="animate-spin" /></div> : (
              filteredMaestro.map((m, idx) => (
                <div 
                  key={m?.id || idx} 
                  onClick={() => toggleSelection(m)}
                  className={`p-3 rounded-lg border-b border-slate-100 last:border-0 cursor-pointer transition-colors flex items-start gap-3 hover:bg-slate-50 ${isSelected(m?.id) ? 'bg-blue-50/50' : ''}`}
                >
                  <input type="checkbox" checked={isSelected(m?.id)} readOnly className="mt-1" />
                  <div>
                    <div className="text-sm font-bold text-slate-700 leading-none mb-1">{m?.nombre || 'Sin nombre'}</div>
                    <div className="text-xs text-slate-400 font-mono">{m?.codigo || 'Sin código'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Seleccionar Sucursal</label>
            <select 
              value={selectedSucursal}
              onChange={(e) => setSelectedSucursal(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white transition-colors"
            >
              {(sucursales || []).map((s, idx) => (
                <option key={s?.sucursal || idx} value={s?.sucursal || ''}>{s?.sucursal || 'Sin nombre'}</option>
              ))}
            </select>
          </div>
          
          <div className="border border-slate-200 rounded-xl flex flex-col h-[500px] bg-slate-50/50">
            <div className="p-3 border-b border-slate-200 bg-white rounded-t-xl">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                <span>ÍTEMS SELECCIONADOS ({items.length})</span>
              </h4>
            </div>
          <div className="overflow-y-auto flex-1 p-4">
            {loadingItems ? <div className="p-8 text-center text-slate-400 flex justify-center"><Loader2 size={24} className="animate-spin" /></div> : (
              items.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">
                  Ningún ítem seleccionado
                </div>
              ) : (
                <div className="space-y-2">
                  {(items || []).map((item, idx) => (
                    <div key={item?.id_ref || idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-700">{item?.nombre || 'Sin nombre'}</div>
                        <div className="text-xs text-slate-400 font-mono">{item?.codigo || 'Sin código'}</div>
                      </div>
                      <button onClick={() => toggleSelection({id: item?.id_ref})} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                        <Save size={16} className="hidden"/>
                        <span className="text-xl leading-none">&times;</span>
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
        </div>
      </div>

      <div className="flex gap-2 items-center pt-4 mt-6 border-t border-slate-100">
        <button 
          onClick={handleSave} 
          disabled={saving || !selectedSucursal}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar Configuración
        </button>
        {saveMsg && <span className={`text-sm font-medium ${saveMsg.includes('✅') ? 'text-emerald-600' : 'text-red-600'}`}>{saveMsg}</span>}
      </div>

      {Object.keys(allSelections).length > 0 && (
        <div className="pt-8 mt-4 border-t border-slate-200">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
            Resumen de Selecciones (Todas las Sucursales)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(allSelections).filter(([_, items]) => items.length > 0).map(([sucursal, items]) => (
              <div key={sucursal} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <h5 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
                  <Building2 size={16} className="text-blue-500" />
                  {sucursal}
                </h5>
                <div className="flex flex-wrap gap-2">
                  {items.map((i: any, idx: number) => (
                    <span key={idx} className="bg-white border border-slate-200 text-slate-600 text-xs font-medium px-2 py-1 rounded-md shadow-sm">
                      {i.nombre}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {Object.values(allSelections).every(items => items.length === 0) && (
              <p className="text-sm text-slate-400">No hay configuraciones guardadas en ninguna sucursal.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
