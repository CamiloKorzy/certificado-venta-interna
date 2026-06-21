import React, { useEffect, useState, useMemo } from 'react';
import { Wrench, UploadCloud, Trash2, Search, DollarSign, Clock, AlertCircle, Loader2, Check, FileSpreadsheet, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

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
    if (res.status === 401) {
      localStorage.removeItem('cert_token');
      window.location.reload();
    }
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`HTTP ${res.status}: ${t}`);
    }
    return res.json();
  });
}

interface EquipoItem {
  id: number | null;
  origen: 'PLANILLA' | 'FINNEGANS';
  equipo: string;
  concepto: string;
  horas_kilometros: number;
  precio_unitario: number;
  total: number;
  documento?: string;
  comprobante?: string;
  fecha?: string;
  usuario_carga?: string;
  fecha_carga?: string;
}

export default function Equipos({
  token,
  unidadNegocio,
  periodo
}: {
  token: string;
  unidadNegocio: string;
  periodo: string;
}) {
  const [data, setData] = useState<EquipoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [reportClosed, setReportClosed] = useState(false);

  const downloadTemplate = () => {
    const ws_data = [
      ['Equipo', 'Concepto', 'Horas/Kilometros', 'Precio Unitario', 'Total'],
      ['Pala Cargadora 01', 'Alquiler Mensual', 160, 25000, 4000000]
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wscols = [{wch:25}, {wch:25}, {wch:18}, {wch:18}, {wch:18}];
    ws['!cols'] = wscols;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Equipos");
    XLSX.writeFile(wb, `Plantilla_Equipos.xlsx`);
  };

  useEffect(() => {
    if (unidadNegocio && periodo) {
      fetchReportStateAndEquipos();
    }
  }, [unidadNegocio, periodo]);

  const fetchReportStateAndEquipos = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const pStr = periodo.replace('/', '-');
      // Fetch report state
      const stateRes = await apiFetch(`/api/informes/estado?unidad_negocio=${encodeURIComponent(unidadNegocio)}&periodo=${encodeURIComponent(pStr)}`, token);
      if (stateRes.existe && stateRes.estado === 'CERRADO') {
        setReportClosed(true);
      } else {
        setReportClosed(false);
      }

      // Fetch equipos
      const res = await apiFetch(`/api/equipos?unidad_negocio=${encodeURIComponent(unidadNegocio)}&periodo=${encodeURIComponent(pStr)}`, token);
      setData(Array.isArray(res) ? res : []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Error al cargar datos de equipos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('unidad_negocio', unidadNegocio);
    formData.append('periodo', periodo.replace('/', '-'));

    try {
      const res = await fetch(`${API_URL}/api/equipos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Error en la subida: ${res.status}`);
      }

      const json = await res.json();
      if (json.errors && json.errors.length > 0) {
        setError(`Se subieron algunos registros con advertencias: \n${json.errors.slice(0, 5).join('\n')}`);
      } else {
        setSuccessMsg(`Planilla importada exitosamente. Se agregaron ${json.inserted} registros.`);
      }
      
      // Refresh list
      const pStr = periodo.replace('/', '-');
      const refreshRes = await apiFetch(`/api/equipos?unidad_negocio=${encodeURIComponent(unidadNegocio)}&periodo=${encodeURIComponent(pStr)}`, token);
      setData(Array.isArray(refreshRes) ? refreshRes : []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al subir la planilla de equipos');
    } finally {
      setUploading(false);
      // Clear file input
      e.target.value = '';
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (reportClosed) return;
    if (!window.confirm('¿Está seguro de que desea eliminar este registro?')) return;

    setDeletingId(id);
    setError('');
    setSuccessMsg('');

    try {
      await apiFetch(`/api/equipos/${id}`, token, { method: 'DELETE' });
      setSuccessMsg('Registro eliminado correctamente.');
      setData(prev => prev.filter(item => item.id !== id));
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Error al eliminar el registro');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteBulk = async () => {
    if (reportClosed) return;
    if (!window.confirm('¿Está seguro de que desea eliminar TODOS los registros importados de esta planilla? (Esto no afectará los datos de Finnegans)')) return;

    setDeletingBulk(true);
    setError('');
    setSuccessMsg('');

    try {
      const pStr = periodo.replace('/', '-');
      await apiFetch(`/api/equipos/bulk?unidad_negocio=${encodeURIComponent(unidadNegocio)}&periodo=${encodeURIComponent(pStr)}`, token, {
        method: 'DELETE'
      });
      setSuccessMsg('Planilla eliminada por completo.');
      setData(prev => prev.filter(item => item.origen !== 'PLANILLA'));
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Error al eliminar la planilla');
    } finally {
      setDeletingBulk(false);
    }
  };

  // Filtered data
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(item => 
      (item.equipo || '').toLowerCase().includes(term) ||
      (item.concepto || '').toLowerCase().includes(term) ||
      (item.origen || '').toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  // Indicators
  const stats = useMemo(() => {
    const totalHorasKm = filteredData.reduce((acc, item) => acc + (item.horas_kilometros || 0), 0);
    const totalCosto = filteredData.reduce((acc, item) => acc + (item.total || 0), 0);
    const totalFinnegans = filteredData.filter(i => i.origen === 'FINNEGANS').reduce((acc, item) => acc + (item.total || 0), 0);
    const totalPlanilla = filteredData.filter(i => i.origen === 'PLANILLA').reduce((acc, item) => acc + (item.total || 0), 0);
    return { totalHorasKm, totalCosto, totalFinnegans, totalPlanilla };
  }, [filteredData]);

  // Format helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto px-6 py-4 font-sans">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Wrench className="text-blue-600 h-6 w-6" />
            Certificaciones y Uso de Equipos
          </h2>
          <p className="text-sm text-slate-500">
            Visualiza y carga las planillas de alquileres o uso de equipos de la unidad y período seleccionado.
          </p>
        </div>

        {/* Upload and Delete buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {!reportClosed ? (
            <>
              {/* Delete bulk if there are planilla items */}
              {data.some(i => i.origen === 'PLANILLA') && (
                <button
                  onClick={handleDeleteBulk}
                  disabled={deletingBulk}
                  className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-4 rounded-xl text-sm border border-red-200 transition-colors shadow-sm disabled:opacity-55"
                >
                  {deletingBulk ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Eliminar Planilla Importada
                </button>
              )}

              {/* Descargar Plantilla */}
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-xl text-sm border border-slate-200 transition-all shadow-sm"
              >
                <Download size={16} />
                Descargar Plantilla
              </button>

              {/* Upload Input */}
              <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-sm transition-all shadow-sm shadow-blue-500/10 cursor-pointer select-none">
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                Importar Planilla (Excel)
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </>
          ) : (
            <span className="bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200">
              Reporte Cerrado (Solo lectura)
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3 whitespace-pre-line">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-start gap-3">
          <Check className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Operación exitosa</p>
            <p className="text-sm opacity-90">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Cargando equipos...</p>
        </div>
      ) : (
        <>
          {/* Indicators Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Equipos */}
            <div className="bg-gradient-to-br from-white to-blue-50/10 p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                <DollarSign size={80} className="text-blue-600" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                    <DollarSign size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Costo Total</span>
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-2xl font-black text-slate-800">{formatCurrency(stats.totalCosto)}</h3>
                  <p className="text-xs text-slate-500">Costo total de equipos en el período</p>
                </div>
              </div>
            </div>

            {/* Total Horas/Km */}
            <div className="bg-gradient-to-br from-white to-indigo-50/10 p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                <Clock size={80} className="text-indigo-600" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Clock size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Horas/Km</span>
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-2xl font-black text-slate-800">{formatNumber(stats.totalHorasKm)}</h3>
                  <p className="text-xs text-slate-500">Volumen registrado</p>
                </div>
              </div>
            </div>

            {/* Finnegans (Auto) */}
            <div className="bg-gradient-to-br from-white to-emerald-50/10 p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                <DollarSign size={80} className="text-emerald-600" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <Check size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Costo Finnegans</span>
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-2xl font-black text-slate-800">{formatCurrency(stats.totalFinnegans)}</h3>
                  <p className="text-xs text-slate-500">Taller Central (Ventas Internas)</p>
                </div>
              </div>
            </div>

            {/* Planilla (Cargado) */}
            <div className="bg-gradient-to-br from-white to-amber-50/10 p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                <FileSpreadsheet size={80} className="text-amber-600" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                    <FileSpreadsheet size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Costo Planilla</span>
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-2xl font-black text-slate-800">{formatCurrency(stats.totalPlanilla)}</h3>
                  <p className="text-xs text-slate-500">Alquileres cargados manualmente</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4.5 w-4.5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por equipo, concepto u origen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/55 hover:bg-slate-55 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
              />
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {filteredData.length} ítems en total
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 sticky top-0 z-10">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Origen</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Equipo / Detalle</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Concepto</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Horas / Kilómetros</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Precio Unitario</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right font-bold text-slate-700">Total</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Info Adicional / Carga</th>
                    {!reportClosed && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-24">Acción</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600 text-sm">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={reportClosed ? 7 : 8} className="px-6 py-12 text-center text-slate-400">
                        No se encontraron registros de equipos.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-55 transition-colors group">
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          {item.origen === 'FINNEGANS' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              FINNEGANS
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              PLANILLA
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-800">{item.equipo}</td>
                        <td className="px-6 py-3.5 text-slate-700 font-semibold">{item.concepto}</td>
                        <td className="px-6 py-3.5 text-right font-bold text-slate-700">{formatNumber(item.horas_kilometros)}</td>
                        <td className="px-6 py-3.5 text-right text-slate-500">{formatCurrency(item.precio_unitario)}</td>
                        <td className="px-6 py-3.5 text-right font-extrabold text-blue-600 bg-blue-50/10 group-hover:bg-blue-50/20">{formatCurrency(item.total)}</td>
                        <td className="px-6 py-3.5 text-xs text-slate-400 max-w-xs truncate">
                          {item.origen === 'FINNEGANS' ? (
                            <span title={`Doc: ${item.documento} - Comp: ${item.comprobante} - Fecha: ${item.fecha}`}>
                              📄 {item.documento || 'Venta Interna'} • {item.fecha}
                            </span>
                          ) : (
                            <span title={`Cargado por: ${item.usuario_carga} - Fecha: ${item.fecha_carga}`}>
                              👤 {item.usuario_carga} • {item.fecha_carga?.substring(0, 10)}
                            </span>
                          )}
                        </td>
                        {!reportClosed && (
                          <td className="px-6 py-3.5 text-center whitespace-nowrap">
                            {item.origen === 'PLANILLA' && item.id !== null ? (
                              <button
                                onClick={() => handleDeleteItem(item.id!)}
                                disabled={deletingId === item.id}
                                className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center justify-center disabled:opacity-50"
                                title="Eliminar este registro"
                              >
                                {deletingId === item.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                              </button>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Summary Footer */}
            <div className="bg-slate-55 px-6 py-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-500 tracking-wider">
              <span>MOSTRANDO {filteredData.length} DE {data.length} REGISTROS</span>
              <span className="text-slate-700 font-extrabold text-sm">TOTAL COSTO: {formatCurrency(stats.totalCosto)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
