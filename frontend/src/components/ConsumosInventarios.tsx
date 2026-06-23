import React, { useEffect, useState, useMemo } from 'react';
import { Package, Search, DollarSign, ListCollapse, Layers, AlertCircle, Loader2, Building2 } from 'lucide-react';

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

interface ConsumoItem {
  fecha: string;
  comprobante: string;
  insumo: string;
  cantidad: number;
  unidad: string;
  precio_unitario: number;
  total: number;
  orden_produccion: string;
  deposito: string;
  sucursal?: string;
}

const getRubro = (insumoName: string): string => {
  const name = (insumoName || '').toLowerCase();
  if (name.includes('guante') || name.includes('protector') || name.includes('mascarilla') || name.includes('antiparra') || name.includes('botón') || name.includes('bota') || name.includes('chaleco') || name.includes('faja') || name.includes('casco') || name.includes('grafa') || name.includes('pantalón') || name.includes('camisa')) {
    return 'Seguridad e Higiene (EPP)';
  }
  if (name.includes('agua bid') || name.includes('cebola') || name.includes('cebolla') || name.includes('tomate') || name.includes('zanahoria') || name.includes('papa') || name.includes('morrón') || name.includes('ajo') || name.includes('zapallo') || name.includes('verdeo') || name.includes('perejil') || name.includes('harina') || name.includes('repollo') || name.includes('yerba') || name.includes('huevo') || name.includes('fideo') || name.includes('arroz') || name.includes('carne') || name.includes('pan ') || name.includes('aceite') || name.includes('aguja') || name.includes('vaco') || name.includes('pulpa') || name.includes('pollo')) {
    return 'Alimentos y Comedor';
  }
  if (name.includes('piedra') || name.includes('escollera') || name.includes('arena') || name.includes('estabilizado') || name.includes('binder') || name.includes('suelo')) {
    return 'Áridos y Cantera';
  }
  if (name.includes('cemento') || name.includes('cal ') || name.includes('yeso') || name.includes('hormigón')) {
    return 'Cemento y Ligantes';
  }
  if (name.includes('alambre') || name.includes('hierro') || name.includes('clavo') || name.includes('electrodo') || name.includes('bulón') || name.includes('arandela') || name.includes('chapa') || name.includes('perfil') || name.includes('disco') || name.includes('solda') || name.includes('tornillo') || name.includes('tuerca')) {
    return 'Hierros y Ferretería';
  }
  if (name.includes('gasoil') || name.includes('combustible') || name.includes('nafta') || name.includes('aceite lubricante') || name.includes('grasa') || name.includes('filtro') || name.includes('batería') || name.includes('neumático') || name.includes('cubierta')) {
    return 'Combustibles y Repuestos';
  }
  return 'Otros Insumos';
};

export default function ConsumosInventarios({
  token,
  unidadNegocio,
  periodo
}: {
  token: string;
  unidadNegocio: string;
  periodo: string;
}) {
  const [data, setData] = useState<ConsumoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (unidadNegocio && periodo) {
      fetchConsumos();
    }
  }, [unidadNegocio, periodo]);

  const fetchConsumos = async () => {
    setLoading(true);
    setError('');
    try {
      const pStr = periodo.replace('/', '-'); // standard format in backend
      const res = await apiFetch(`/api/consumos-inventarios?unidad_negocio=${encodeURIComponent(unidadNegocio)}&periodo=${encodeURIComponent(pStr)}`, token);
      setData(Array.isArray(res) ? res : []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Error al cargar consumos de inventarios');
    } finally {
      setLoading(false);
    }
  };

  // Filtered data
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(item => 
      (item.insumo || '').toLowerCase().includes(term) ||
      (item.comprobante || '').toLowerCase().includes(term) ||
      (item.deposito || '').toLowerCase().includes(term) ||
      (item.orden_produccion || '').toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  // Indicators
  const stats = useMemo(() => {
    const totalConsumido = filteredData.reduce((acc, item) => acc + (item.total || 0), 0);
    const transacciones = filteredData.length;
    const insumosDiferentes = new Set(filteredData.map(item => item.insumo)).size;
    return { totalConsumido, transacciones, insumosDiferentes };
  }, [filteredData]);

  // Aggregated totals
  const rubrosTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredData.forEach(item => {
      const rubro = getRubro(item.insumo);
      totals[rubro] = (totals[rubro] || 0) + (item.total || 0);
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const depositosTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredData.forEach(item => {
      const dep = item.deposito || 'Sin Depósito';
      totals[dep] = (totals[dep] || 0) + (item.total || 0);
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const sucursalesTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredData.forEach(item => {
      const suc = item.sucursal || 'Sin Sucursal';
      totals[suc] = (totals[suc] || 0) + (item.total || 0);
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Format helper for Currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  // Format helper for numbers
  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto px-6 py-4 font-sans">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-blue-600 h-6 w-6" />
            Consumos de Inventarios
          </h2>
          <p className="text-sm text-slate-500">
            Detalle de los consumos de inventarios valorizados para {unidadNegocio} en el período {periodo}.
          </p>
        </div>
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por insumo, comprobante, depósito..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/55 hover:bg-slate-55 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error al cargar datos</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Cargando consumos de inventarios...</p>
        </div>
      ) : (
        <>
          {/* Indicators Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Consumido */}
            <div className="bg-gradient-to-br from-white to-blue-50/10 p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                <DollarSign size={80} className="text-blue-600" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                    <DollarSign size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Consumido</span>
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-2xl font-black text-slate-800">{formatCurrency(stats.totalConsumido)}</h3>
                  <p className="text-xs text-slate-500">Valorizado total del período</p>
                </div>
              </div>
            </div>

            {/* Cantidad Transacciones */}
            <div className="bg-gradient-to-br from-white to-indigo-50/10 p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                <ListCollapse size={80} className="text-indigo-600" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <ListCollapse size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transacciones</span>
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-2xl font-black text-slate-800">{formatNumber(stats.transacciones)}</h3>
                  <p className="text-xs text-slate-500">Consumos registrados</p>
                </div>
              </div>
            </div>

            {/* Insumos Diferentes */}
            <div className="bg-gradient-to-br from-white to-emerald-50/10 p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                <Layers size={80} className="text-emerald-600" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <Layers size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Insumos Diferentes</span>
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-2xl font-black text-slate-800">{formatNumber(stats.insumosDiferentes)}</h3>
                  <p className="text-xs text-slate-500">Tipos de materiales utilizados</p>
                </div>
              </div>
            </div>
          </div>

          {/* Aggregated Summaries Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Totales por Rubro */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5 flex flex-col space-y-3 hover:shadow-md transition-shadow">
              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 border-b pb-2">
                <Layers className="text-blue-600 h-4.5 w-4.5" /> Totales por Rubro
              </h4>
              <div className="overflow-y-auto max-h-[220px] pr-1.5 space-y-2">
                {rubrosTotals.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No hay datos de rubros</p>
                ) : (
                  rubrosTotals.map((r, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-semibold hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                      <span className="text-slate-600 truncate mr-2" title={r.name}>{r.name}</span>
                      <span className="font-extrabold text-blue-600 whitespace-nowrap">{formatCurrency(r.value)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Totales por Depósito */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5 flex flex-col space-y-3 hover:shadow-md transition-shadow">
              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 border-b pb-2">
                <Package className="text-indigo-600 h-4.5 w-4.5" /> Totales por Depósito
              </h4>
              <div className="overflow-y-auto max-h-[220px] pr-1.5 space-y-2">
                {depositosTotals.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No hay datos de depósitos</p>
                ) : (
                  depositosTotals.map((d, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-semibold hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                      <span className="text-slate-600 truncate mr-2" title={d.name}>{d.name}</span>
                      <span className="font-extrabold text-indigo-600 whitespace-nowrap">{formatCurrency(d.value)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Totales por Sucursal */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5 flex flex-col space-y-3 hover:shadow-md transition-shadow">
              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 border-b pb-2">
                <Building2 className="text-emerald-600 h-4.5 w-4.5" /> Totales por Sucursal
              </h4>
              <div className="overflow-y-auto max-h-[220px] pr-1.5 space-y-2">
                {sucursalesTotals.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No hay datos de sucursales</p>
                ) : (
                  sucursalesTotals.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-semibold hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                      <span className="text-slate-600 truncate mr-2" title={s.name}>{s.name}</span>
                      <span className="font-extrabold text-emerald-600 whitespace-nowrap">{formatCurrency(s.value)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 sticky top-0 z-10">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Comprobante</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Insumo</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Cantidad</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">U.M.</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Precio Unitario</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right font-bold text-slate-700">Total</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">O. de Producción</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Depósito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600 text-sm">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                        No se encontraron registros de consumos de inventarios.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-55 transition-colors group">
                        <td className="px-6 py-3.5 whitespace-nowrap text-slate-500">{item.fecha}</td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-slate-700 font-semibold">{item.comprobante}</td>
                        <td className="px-6 py-3.5 font-semibold text-slate-800 max-w-xs truncate" title={item.insumo}>{item.insumo}</td>
                        <td className="px-6 py-3.5 text-right font-bold text-slate-700">{formatNumber(item.cantidad)}</td>
                        <td className="px-6 py-3.5 text-slate-500">{item.unidad}</td>
                        <td className="px-6 py-3.5 text-right text-slate-500">{formatCurrency(item.precio_unitario)}</td>
                        <td className="px-6 py-3.5 text-right font-extrabold text-blue-600 bg-blue-50/10 group-hover:bg-blue-50/20">{formatCurrency(item.total)}</td>
                        <td className="px-6 py-3.5 text-slate-500 truncate max-w-[120px]" title={item.orden_produccion}>{item.orden_produccion}</td>
                        <td className="px-6 py-3.5 text-slate-500 truncate max-w-[150px]" title={item.deposito}>{item.deposito}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Footer summary */}
            <div className="bg-slate-55 px-6 py-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-500 tracking-wider">
              <span>MOSTRANDO {filteredData.length} DE {data.length} REGISTROS</span>
              <span className="text-slate-700 font-extrabold text-sm">TOTAL: {formatCurrency(stats.totalConsumido)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
