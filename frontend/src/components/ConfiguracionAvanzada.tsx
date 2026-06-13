import React, { useEffect, useState } from 'react';
import { Save, Check, Loader2, X, Plus, Trash2, Edit2 } from 'lucide-react';

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

export default function ConfiguracionAvanzada({ token, tipo }: { token: string, tipo: 'ingresos' | 'gastos-asientos' | 'gastos-compras' | 'unidades' }) {
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
