import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, FolderLock, FolderOpen, Calendar, Building, Loader2, Info, AlertCircle } from 'lucide-react';
import { MultiSelect } from './MultiSelect';

export default function GestorInformes({ token, onOpenReport, user }: any) {
  const [customDialog, setCustomDialog] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm';
    title?: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({ isOpen: false, type: 'alert', message: '' });

  const showConfirm = (message: string, title: string = 'Confirmación') => {
    return new Promise<boolean>((resolve) => {
      setCustomDialog({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        onConfirm: () => {
          setCustomDialog(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setCustomDialog(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  };

  const showAlert = (message: string, title: string = 'Mensaje') => {
    return new Promise<void>((resolve) => {
      setCustomDialog({
        isOpen: true,
        type: 'alert',
        title,
        message,
        onConfirm: () => {
          setCustomDialog(prev => ({ ...prev, isOpen: false }));
          resolve();
        }
      });
    });
  };

  const renderCustomDialog = () => {
    if (!customDialog.isOpen) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md flex flex-col overflow-hidden transform transition-all scale-100">
          <div className="p-6 flex flex-col items-center text-center space-y-4">
            <div className={`p-3 rounded-full ${customDialog.type === 'confirm' ? 'bg-amber-50 text-amber-500 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
              {customDialog.type === 'confirm' ? (
                <AlertCircle size={28} />
              ) : (
                <Info size={28} />
              )}
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-800 text-lg">
                {customDialog.title || (customDialog.type === 'confirm' ? 'Confirmación' : 'Mensaje')}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">
                {customDialog.message}
              </p>
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-3">
            {customDialog.type === 'confirm' ? (
              <>
                <button
                  onClick={() => {
                    if (customDialog.onCancel) customDialog.onCancel();
                  }}
                  className="flex-grow bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (customDialog.onConfirm) customDialog.onConfirm();
                  }}
                  className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-sm"
                >
                  Aceptar
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  if (customDialog.onConfirm) customDialog.onConfirm();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-sm"
              >
                Aceptar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handlePresentar = async (inf: any) => {
    const [y, m] = inf.periodo.split('-');
    const confirmed = await showConfirm(
      `¿Estás seguro de presentar el período ${m}/${y} para la sucursal "${inf.unidad_negocio}"?\n\nUna vez presentado, no podrás incorporar ni modificar datos de este período y sucursal.`,
      "Confirmar Cierre"
    );
    if (!confirmed) return;
    try {
      const res = await fetch('/api/informes/cerrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          unidad_negocio: inf.unidad_negocio,
          periodo: inf.periodo,
          usuario: user?.email || 'Usuario'
        })
      });
      if (!res.ok) {
         const j = await res.json();
         throw new Error(j.detail || "Error al presentar periodo");
      }
      await showAlert("Periodo presentado correctamente", "Éxito");
      fetchInformes();
    } catch(e: any) {
      await showAlert(e.message, "Error");
    }
  };

  const handleReabrir = async (inf: any) => {
    const [y, m] = inf.periodo.split('-');
    const confirmed = await showConfirm(`¿Seguro que deseas reabrir el período ${m}/${y} para ${inf.unidad_negocio}?`);
    if (!confirmed) return;
    try {
      const res = await fetch('/api/informes/reabrir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          unidad_negocio: inf.unidad_negocio,
          periodo: inf.periodo,
          usuario: user?.email || 'Usuario'
        })
      });
      if (!res.ok) {
         const j = await res.json();
         throw new Error(j.detail || "Error al reabrir periodo");
      }
      await showAlert("Periodo reabierto correctamente", "Éxito");
      fetchInformes();
    } catch(e: any) {
      await showAlert(e.message, "Error");
    }
  };

  const [informes, setInformes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [nuevaUnidad, setNuevaUnidad] = useState<string>('');
  const [nuevoPeriodo, setNuevoPeriodo] = useState<string>('');
  const [error, setError] = useState('');
  const [fetchError, setFetchError] = useState('');

  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const currentYear = new Date().getFullYear();
  const defaultPeriod = `${currentMonth}/${currentYear}`;

  const fetchUnidades = useCallback(async () => {
    try {
      const res = await fetch('/api/mis-unidades', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('cert_token');
        localStorage.removeItem('cert_user');
        window.location.reload();
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setUnidades(json);
        if (json.length > 0) setNuevaUnidad(json[0].nombre);
      }
    } catch (e) {
      console.error('[GestorInformes] Error cargando unidades:', e);
    }
  }, [token]);

  const fetchInformes = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/informes/lista', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('cert_token');
        localStorage.removeItem('cert_user');
        window.location.reload();
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setInformes(Array.isArray(json) ? json : []);
      } else {
        const errorText = await res.text();
        setFetchError(`Error ${res.status}: ${errorText}`);
      }
    } catch (e: any) {
      setFetchError(`Error de conexión: ${e.message}`);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchUnidades();
      fetchInformes();
    }
  }, [token, fetchUnidades, fetchInformes]);

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
    <div className="p-6 max-w-[1800px] w-full mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-blue-600" /> Reportes de Gestión
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full min-w-[800px] text-left">
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
                  <td className="p-4 flex items-center gap-4">
                    <button onClick={() => onOpenReport(inf.unidad_negocio, perStr)} className="text-blue-600 hover:text-blue-800 text-sm font-bold">
                      Abrir Reporte
                    </button>
                    {inf.estado === 'ABIERTO' && (
                      <button 
                        onClick={() => handlePresentar(inf)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition shadow-sm"
                      >
                        Presentar Período
                      </button>
                    )}
                    {inf.estado === 'CERRADO' && user?.rol === 'admin' && (
                      <button 
                        onClick={() => handleReabrir(inf)}
                        className="px-3 py-1 border border-red-600 text-red-600 hover:bg-red-50 rounded text-xs font-bold transition shadow-sm"
                      >
                        Reabrir
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {loading && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">
                <Loader2 size={24} className="mx-auto animate-spin text-blue-500 mb-2" />
                Cargando informes...
              </td></tr>
            )}
            {!loading && fetchError && (
              <tr><td colSpan={5} className="p-8 text-center">
                <p className="text-red-600 font-medium mb-2">{fetchError}</p>
                <button onClick={fetchInformes} className="text-blue-600 hover:underline text-sm">Reintentar</button>
              </td></tr>
            )}
            {!loading && !fetchError && informes.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">No hay informes creados</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {renderCustomDialog()}
    </div>
  );
}
