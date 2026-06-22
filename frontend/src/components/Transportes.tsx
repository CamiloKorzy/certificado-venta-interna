import React, { useEffect, useState, useMemo } from 'react';
import { Truck, Search, DollarSign, Clock, AlertCircle, Loader2, Check, FileText, Download } from 'lucide-react';
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

interface TransporteItem {
  id: number | null;
  origen: 'FINNEGANS' | 'SUPABASE_CERT';
  fecha: string;
  transportista: string;
  chofer: string;
  producto: string;
  cantidad: number;
  toneladas: number;
  precio_unitario: number;
  total: number;
  documento?: string;
  comprobante?: string;
  remitos?: string[];
}

export default function Transportes({
  token,
  unidadNegocio,
  periodo
}: {
  token: string;
  unidadNegocio: string;
  periodo: string;
}) {
  const [data, setData] = useState<TransporteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [reportClosed, setReportClosed] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (unidadNegocio && periodo) {
      fetchReportStateAndTransportes();
    }
  }, [unidadNegocio, periodo]);

  const fetchReportStateAndTransportes = async () => {
    setLoading(true);
    setError('');
    try {
      const pStr = periodo.replace('/', '-');
      // Fetch report state
      const stateRes = await apiFetch(`/api/informes/estado?unidad_negocio=${encodeURIComponent(unidadNegocio)}&periodo=${encodeURIComponent(pStr)}`, token);
      if (stateRes.existe && stateRes.estado === 'CERRADO') {
        setReportClosed(true);
      } else {
        setReportClosed(false);
      }

      // Fetch transportes
      const res = await apiFetch(`/api/transportes?unidad_negocio=${encodeURIComponent(unidadNegocio)}&periodo=${encodeURIComponent(pStr)}`, token);
      setData(Array.isArray(res) ? res : []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Error al cargar datos de transportes/fletes');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const exportData = filteredData.map(item => ({
      'Origen': item.origen,
      'Fecha': item.fecha,
      'Transportista': item.transportista,
      'Chofer': item.chofer,
      'Producto': item.producto,
      'Viajes (Cantidad)': item.cantidad,
      'Toneladas': item.toneladas,
      'Tarifa': item.precio_unitario,
      'Total': item.total,
      'Documento': item.documento || '',
      'Comprobante': item.comprobante || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fletes_Certificados");
    XLSX.writeFile(wb, `Transportes_${unidadNegocio.replace(/\s+/g, '_')}_${periodo.replace('/', '_')}.xlsx`);
  };

  // Filtered data
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(item => 
      (item.chofer || '').toLowerCase().includes(term) ||
      (item.producto || '').toLowerCase().includes(term) ||
      (item.transportista || '').toLowerCase().includes(term) ||
      (item.origen || '').toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  // Indicators
  const stats = useMemo(() => {
    const totalCosto = filteredData.reduce((acc, item) => acc + (item.total || 0), 0);
    const totalToneladas = filteredData.reduce((acc, item) => acc + (item.toneladas || 0), 0);
    const totalViajes = filteredData.reduce((acc, item) => acc + (item.cantidad || 0), 0);
    const countSupabase = filteredData.filter(i => i.origen === 'SUPABASE_CERT').length;
    const countFinnegans = filteredData.filter(i => i.origen === 'FINNEGANS').length;
    
    // Average rate weighted by tons (or count if tons is 0)
    let totalWeight = 0;
    let rateSum = 0;
    filteredData.forEach(item => {
      const weight = item.toneladas > 0 ? item.toneladas : (item.cantidad > 0 ? item.cantidad : 1);
      rateSum += item.precio_unitario * weight;
      totalWeight += weight;
    });
    const avgTarifa = totalWeight > 0 ? (rateSum / totalWeight) : 0;

    return { totalCosto, totalToneladas, totalViajes, countSupabase, countFinnegans, avgTarifa };
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
            <Truck className="text-blue-600 h-6 w-6" />
            Certificaciones de Transportes / Fletes
          </h2>
          <p className="text-sm text-slate-500">
            Visualiza y consolida las certificaciones por viajes y fletes de la unidad y período seleccionado.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {filteredData.length > 0 && (
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-xl text-sm border border-slate-200 transition-all shadow-sm"
            >
              <Download size={16} />
              Exportar a Excel
            </button>
          )}
          {reportClosed && (
            <span className="bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200">
              Reporte Cerrado (Solo lectura)
            </span>
          )}
        </div>
      </div>

      {/* Message if error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3 whitespace-pre-line">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Cargando transportes/fletes...</p>
        </div>
      ) : (
        <>
          {/* Indicators Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Costo Total */}
            <div className="bg-gradient-to-br from-white to-blue-50/10 p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                <DollarSign size={80} className="text-blue-600" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                    <DollarSign size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Costo Fletes</span>
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xl font-black text-slate-800">{formatCurrency(stats.totalCosto)}</h3>
                  <p className="text-[11px] text-slate-500">Valor total certificado</p>
                </div>
              </div>
            </div>

            {/* Total Toneladas */}
            <div className="bg-gradient-to-br from-white to-indigo-50/10 p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                <Clock size={80} className="text-indigo-600" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Truck size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toneladas</span>
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xl font-black text-slate-800">{formatNumber(stats.totalToneladas)} TN</h3>
                  <p className="text-[11px] text-slate-500">Volumen total de carga</p>
                </div>
              </div>
            </div>

            {/* Total Viajes */}
            <div className="bg-gradient-to-br from-white to-emerald-50/10 p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                <Check size={80} className="text-emerald-600" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <Check size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Viajes</span>
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xl font-black text-slate-800">{formatNumber(stats.totalViajes)}</h3>
                  <p className="text-[11px] text-slate-500">Cantidad total de viajes</p>
                </div>
              </div>
            </div>

            {/* Tarifa Promedio */}
            <div className="bg-gradient-to-br from-white to-amber-50/10 p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                <DollarSign size={80} className="text-amber-600" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                    <DollarSign size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tarifa Promedio</span>
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xl font-black text-slate-800">{formatCurrency(stats.avgTarifa)}</h3>
                  <p className="text-[11px] text-slate-500">Tarifa ponderada por volumen</p>
                </div>
              </div>
            </div>

            {/* Certs en Supabase */}
            <div className="bg-gradient-to-br from-white to-purple-50/10 p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                <Truck size={80} className="text-purple-600" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
                    <Truck size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fuentes</span>
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xl font-black text-slate-800">
                    {stats.countSupabase} / {stats.countFinnegans}
                  </h3>
                  <p className="text-[11px] text-slate-500">Certificaciones / Partes ERP</p>
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
                placeholder="Buscar por chofer, producto u origen..."
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
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Transportista</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider font-bold text-slate-800">Chofer</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Viajes</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Toneladas</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Tarifa</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right font-bold text-slate-700">Total</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Detalles / Remitos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600 text-sm">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                        No se encontraron registros de transportes o fletes.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, idx) => (
                      <React.Fragment key={idx}>
                        <tr className="hover:bg-slate-55 transition-colors group">
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            {item.origen === 'FINNEGANS' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                FINNEGANS
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100 animate-pulse">
                                SUPABASE CERT
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-slate-500">
                            {item.fecha}
                          </td>
                          <td className="px-6 py-3.5 truncate max-w-xs text-slate-700 font-semibold">
                            {item.transportista}
                          </td>
                          <td className="px-6 py-3.5 font-bold text-slate-800">
                            {item.chofer}
                          </td>
                          <td className="px-6 py-3.5 text-slate-700 font-semibold">
                            {item.producto}
                          </td>
                          <td className="px-6 py-3.5 text-right font-bold text-slate-500">
                            {formatNumber(item.cantidad)}
                          </td>
                          <td className="px-6 py-3.5 text-right font-bold text-slate-700">
                            {item.toneladas > 0 ? `${formatNumber(item.toneladas)} TN` : '-'}
                          </td>
                          <td className="px-6 py-3.5 text-right text-slate-500">
                            {formatCurrency(item.precio_unitario)}
                          </td>
                          <td className="px-6 py-3.5 text-right font-extrabold text-blue-600 bg-blue-50/10 group-hover:bg-blue-50/20">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-slate-400">
                            {item.remitos && item.remitos.length > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                                  className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 transition-all font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <FileText size={11} /> {item.remitos.length} {item.remitos.length === 1 ? 'remito' : 'remitos'}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                        {expandedIdx === idx && item.remitos && item.remitos.length > 0 && (
                          <tr className="bg-slate-50/45">
                            <td colSpan={10} className="px-6 py-4 border-b border-slate-200/50">
                              <div className="space-y-2 pl-8 text-xs font-semibold text-slate-650">
                                <h4 className="text-slate-700 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                  <FileText size={12} className="text-blue-600" />
                                  Remitos / Comprobantes Asociados (Finnegans):
                                </h4>
                                <div className="flex flex-wrap gap-2 pl-2">
                                  {item.remitos.map((rem, r_idx) => (
                                    <span key={r_idx} className="bg-white border border-slate-250 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-bold shadow-xs">
                                      📄 {rem}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
