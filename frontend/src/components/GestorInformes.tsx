import React, { useState, useEffect } from 'react';
import { FileText, Plus, FolderLock, FolderOpen, Calendar, Building } from 'lucide-react';
import { MultiSelect } from './MultiSelect';

export default function GestorInformes({ token, onOpenReport, user }: any) {
  const [informes, setInformes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [nuevaUnidad, setNuevaUnidad] = useState<string>('');
  const [nuevoPeriodo, setNuevoPeriodo] = useState<string>('');
  const [error, setError] = useState('');

  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const currentYear = new Date().getFullYear();
  const defaultPeriod = `${currentMonth}/${currentYear}`;

  useEffect(() => {
    fetchUnidades();
    fetchInformes();
  }, [token]);

  const fetchUnidades = async () => {
    try {
      const res = await fetch('/api/mis-unidades', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setUnidades(json);
        if (json.length > 0) setNuevaUnidad(json[0].nombre);
      }
    } catch (e) {}
  };

  const fetchInformes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/informes/lista', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        console.log('[GestorInformes] Informes cargados:', json);
        setInformes(Array.isArray(json) ? json : []);
      } else {
        console.error('[GestorInformes] Error HTTP:', res.status, await res.text());
      }
    } catch (e) {
      console.error('[GestorInformes] Fetch error:', e);
    }
    setLoading(false);
  };

  const handleIniciarInforme = async () => {
    if (!nuevaUnidad || !nuevoPeriodo) {
      setError("Selecciona unidad y periodo");
      return;
    }
    try {
      const parts = nuevoPeriodo.split('/');
      const p = `${parts[1]}-${parts[0].padStart(2, '0')}`;
      
      const res = await fetch('/api/informes/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ unidad_negocio: nuevaUnidad, periodo: p, usuario: user?.email || 'Usuario' })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al iniciar informe");
      }
      
      onOpenReport(nuevaUnidad, nuevoPeriodo); // YYYY-MM or MM/YYYY? Let's use MM/YYYY for UI compatibility
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-blue-600" /> Proyectos de Informes
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Gestiona el ciclo de vida de los informes de gestión</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Plus size={20} className="text-blue-600" /> Iniciar Nuevo Informe
        </h2>
        <div className="flex gap-4 items-end">
          <div className="w-64">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Unidad</label>
            <select value={nuevaUnidad} onChange={e => setNuevaUnidad(e.target.value)} className="w-full p-2.5 border rounded-lg bg-slate-50">
              {unidades.map(u => <option key={u.nombre} value={u.nombre}>{u.nombre}</option>)}
            </select>
          </div>
          <div className="w-64">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Periodo</label>
            <select value={nuevoPeriodo} onChange={e => setNuevoPeriodo(e.target.value)} className="w-full p-2.5 border rounded-lg bg-slate-50">
              {['06/2026', '05/2026', '04/2026', '03/2026', '02/2026', '01/2026', '12/2025'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <button onClick={handleIniciarInforme} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
            Iniciar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
            <tr>
              <th className="p-4">Periodo</th>
              <th className="p-4">Unidad de Negocio</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Creado por</th>
              <th className="p-4">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {informes.map(inf => {
              // inf.periodo is YYYY-MM. Convert to MM/YYYY
              const [y, m] = inf.periodo.split('-');
              const perStr = `${m}/${y}`;
              return (
                <tr key={inf.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium flex items-center gap-2"><Calendar size={16} className="text-slate-400"/> {perStr}</td>
                  <td className="p-4"><span className="flex items-center gap-2"><Building size={16} className="text-slate-400"/> {inf.unidad_negocio}</span></td>
                  <td className="p-4">
                    {inf.estado === 'CERRADO' 
                      ? <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1"><FolderLock size={14}/> CERRADO</span>
                      : <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1"><FolderOpen size={14}/> ABIERTO</span>
                    }
                  </td>
                  <td className="p-4 text-sm text-slate-500">{inf.usuario_apertura}</td>
                  <td className="p-4">
                    <button onClick={() => onOpenReport(inf.unidad_negocio, perStr)} className="text-blue-600 hover:underline text-sm font-semibold">
                      Abrir Proyecto
                    </button>
                  </td>
                </tr>
              )
            })}
            {informes.length === 0 && !loading && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">No hay informes creados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
