import React, { useEffect, useState, useMemo } from 'react';
import { Save, Loader2, Check, Building2, Calendar, Plus, Trash2, AlertCircle, Info, X, Search, Wrench } from 'lucide-react';

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

export default function ConfiguracionEquipos({ token }: { token: string }) {
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [selectedSucursal, setSelectedSucursal] = useState<string>('');
  const [maestro, setMaestro] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Form state
  const [eqSearch, setEqSearch] = useState('');
  const [eqOpen, setEqOpen] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState<{ codigo: string, nombre: string } | null>(null);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  
  // Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Table search
  const [tableSearch, setTableSearch] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [sucRes, maestroRes, assignmentsRes] = await Promise.all([
        apiFetch('/api/unidades-negocio', token),
        apiFetch('/api/equipos/maestro', token),
        apiFetch('/api/config/equipos-asignados', token)
      ]);
      
      const sucursalesData = sucRes?.data || (Array.isArray(sucRes) ? sucRes : []);
      setSucursales(sucursalesData);
      if (sucursalesData.length > 0) {
        setSelectedSucursal(sucursalesData[0].sucursal);
      }
      
      setMaestro(Array.isArray(maestroRes) ? maestroRes : []);
      setAssignments(Array.isArray(assignmentsRes) ? assignmentsRes : []);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Error al cargar los datos de configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!selectedSucursal) {
      setErrorMsg('Debe seleccionar una sucursal');
      return;
    }
    if (!selectedEquipo) {
      setErrorMsg('Debe seleccionar un equipo de la lista');
      return;
    }
    if (!fechaDesde) {
      setErrorMsg('La fecha desde es obligatoria');
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/api/config/equipos-asignados', token, {
        method: 'POST',
        body: JSON.stringify({
          sucursal: selectedSucursal,
          equipo_codigo: selectedEquipo.codigo,
          equipo_nombre: selectedEquipo.nombre,
          fecha_desde: fechaDesde,
          fecha_hasta: fechaHasta || null
        })
      });

      setSuccessMsg('✅ Asignación creada exitosamente.');
      
      // Reset form
      setSelectedEquipo(null);
      setEqSearch('');
      setFechaDesde('');
      setFechaHasta('');
      
      // Reload assignments
      const assignmentsRes = await apiFetch('/api/config/equipos-asignados', token);
      setAssignments(Array.isArray(assignmentsRes) ? assignmentsRes : []);
      
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Error al guardar la asignación');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta asignación?')) return;
    setErrorMsg('');
    setSuccessMsg('');
    setDeletingId(id);

    try {
      await apiFetch(`/api/config/equipos-asignados/${id}`, token, {
        method: 'DELETE'
      });
      setSuccessMsg('✅ Asignación eliminada correctamente.');
      setAssignments(prev => prev.filter(item => item.id !== id));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Error al eliminar la asignación');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter master list of equipments
  const filteredEquipos = useMemo(() => {
    const st = eqSearch.toLowerCase().trim();
    if (!st) return maestro.slice(0, 100);
    return maestro.filter(eq => 
      String(eq.nombre || '').toLowerCase().includes(st) ||
      String(eq.codigo || '').toLowerCase().includes(st)
    ).slice(0, 100);
  }, [maestro, eqSearch]);

  // Filter table list of assignments
  const filteredAssignments = useMemo(() => {
    const st = tableSearch.toLowerCase().trim();
    if (!st) return assignments;
    return assignments.filter(a => 
      String(a.sucursal || '').toLowerCase().includes(st) ||
      String(a.equipo_nombre || '').toLowerCase().includes(st) ||
      String(a.equipo_codigo || '').toLowerCase().includes(st)
    );
  }, [assignments, tableSearch]);

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Cargando catálogo y asignaciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side - Add Assignment Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-fit">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Plus size={18} className="text-blue-600" />
            Nueva Asignación de Equipo
          </h3>
          
          <form onSubmit={handleSave} className="space-y-4">
            {/* Sucursal */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Sucursal / Unidad de Negocio *</label>
              <select
                value={selectedSucursal}
                onChange={(e) => setSelectedSucursal(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
              >
                {sucursales.map((s) => (
                  <option key={s.unidad_negocio} value={s.unidad_negocio}>
                    {s.display_name || s.unidad_negocio}
                  </option>
                ))}
              </select>
            </div>

            {/* Equipo Searchable Select */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Equipo / Móvil *</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Escriba para buscar un equipo..."
                  value={eqSearch}
                  onFocus={() => setEqOpen(true)}
                  onBlur={() => setTimeout(() => setEqOpen(false), 250)}
                  onChange={(e) => {
                    setEqSearch(e.target.value);
                    if (selectedEquipo && e.target.value !== selectedEquipo.nombre) {
                      setSelectedEquipo(null);
                    }
                  }}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold text-slate-700"
                />
                
                {eqOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredEquipos.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-slate-400">No se encontraron equipos</div>
                    ) : (
                      filteredEquipos.map((eq) => (
                        <button
                          key={eq.codigo}
                          type="button"
                          onClick={() => {
                            setSelectedEquipo(eq);
                            setEqSearch(eq.nombre);
                            setEqOpen(false);
                          }}
                          className="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 block"
                        >
                          <div className="font-bold text-slate-800 text-xs">{eq.nombre}</div>
                          <div className="text-[10px] text-slate-400 font-bold">Código: {eq.codigo}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {selectedEquipo && (
                <div className="mt-1.5 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <Check size={12} /> Seleccionado: {selectedEquipo.codigo}
                </div>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Desde *</label>
                <div className="relative">
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Hasta (Opcional)</label>
                <div className="relative">
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                  />
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start gap-2">
              <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <span>
                Esta asignación tiene prioridad sobre las imputaciones de Supabase. Si no se completa la fecha "Hasta", la asignación continuará sin límite de fecha.
              </span>
            </div>

            {/* Form actions */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Guardar Asignación
            </button>
          </form>
        </div>

        {/* Right Side - Assignments List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-2 flex flex-col h-[550px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Wrench size={18} className="text-blue-650" />
              Asignaciones Configuradas
            </h3>
            
            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={14} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar asignación..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-55 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Feedback messages inside listing panel */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2 mb-3 text-xs">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg flex items-start gap-2 mb-3 text-xs">
              <Check size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Table Container */}
          <div className="overflow-y-auto flex-1 border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Sucursal</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Equipo / Código</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Desde</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Hasta</th>
                  <th className="px-4 py-3 font-bold text-slate-500 tracking-wider text-center w-20">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {filteredAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                      No se encontraron asignaciones configuradas.
                    </td>
                  </tr>
                ) : (
                  filteredAssignments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-800">{a.sucursal}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-700">{a.equipo_nombre}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">Cód: {a.equipo_codigo}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-500">{formatDateString(a.fecha_desde)}</td>
                      <td className="px-4 py-3">
                        {a.fecha_hasta ? (
                          <span className="font-semibold text-slate-500">{formatDateString(a.fecha_hasta)}</span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            Sin límite
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(a.id)}
                          disabled={deletingId === a.id}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors inline-flex items-center justify-center disabled:opacity-50"
                          title="Eliminar asignación"
                        >
                          {deletingId === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
