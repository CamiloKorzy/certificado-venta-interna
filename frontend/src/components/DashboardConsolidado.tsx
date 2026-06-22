import React, { useState, useEffect } from 'react';
import { Loader2, Calendar, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Building2 } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS_INGRESOS = ['#10b981', '#34d399', '#059669', '#047857', '#6ee7b7', '#a7f3d0', '#065f46'];
const COLORS_GASTOS = ['#f43f5e', '#fb7185', '#e11d48', '#be123c', '#fda4af', '#fecdd3', '#9f1239'];

const authFetch = async (url: string, token: string, options: RequestInit = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  if (res.status === 401) {
    localStorage.removeItem('cert_token');
    localStorage.removeItem('cert_user');
    window.location.reload();
    throw new Error('Sesión expirada');
  }
  return res;
};

const getDefaultPeriod = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${yyyy}`;
};

export default function DashboardConsolidado({ token, defaultPeriodo = getDefaultPeriod() }: { token: string, defaultPeriodo?: string }) {
  const [periodo, setPeriodo] = useState<string>(defaultPeriodo || getDefaultPeriod());
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
  };

  const fetchConsolidado = async (pStr: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/informes/consolidado?periodo=${encodeURIComponent(pStr)}`, token);
      if (!res.ok) {
        throw new Error(`Error ${res.status}: no se pudo cargar el consolidado`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsolidado(periodo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, token]);

  const handlePeriodoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM
    if (!val) return;
    const [y, m] = val.split('-');
    setPeriodo(`${m}/${y}`);
  };

  // Convert mm/yyyy back to yyyy-mm for input type="month"
  const getMonthValue = (p: string) => {
    if (!p) return '';
    const parts = p.split('/');
    if (parts.length === 2) return `${parts[1]}-${parts[0]}`;
    return '';
  };

  const margen = data && data.totales.ingresos > 0 
    ? (data.totales.neto / data.totales.ingresos) * 100 
    : 0;

  return (
    <div className="bg-slate-50 min-h-screen font-sans pb-12">
      {/* Header bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-14 z-30">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
              <PieChart className="text-blue-600" size={28} />
              Dashboard Consolidado
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Visión global de todas las Sucursales/UN
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
              <Calendar size={16} className="text-slate-400" />
              <input
                type="month"
                value={getMonthValue(periodo)}
                onChange={handlePeriodoChange}
                className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer"
              />
            </div>
            <button 
              onClick={() => fetchConsolidado(periodo)}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
              title="Actualizar"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <TrendingUp size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={48} className="animate-spin mb-4 text-blue-500" />
            <p className="font-medium">Consolidando información de todas las unidades...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-center gap-4">
            <TrendingDown size={32} />
            <div>
              <h3 className="font-bold">Error al cargar datos</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : data && (
          <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp size={64} className="text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-slate-500 mb-1 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Total Ingresos
                </p>
                <p className="text-3xl font-black text-slate-800">{formatCurrency(data.totales.ingresos)}</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingDown size={64} className="text-rose-500" />
                </div>
                <p className="text-sm font-bold text-slate-500 mb-1 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div> Total Costos
                </p>
                <p className="text-3xl font-black text-slate-800">{formatCurrency(data.totales.gastos)}</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <DollarSign size={64} className={data.totales.neto >= 0 ? "text-blue-500" : "text-orange-500"} />
                </div>
                <p className="text-sm font-bold text-slate-500 mb-1 flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${data.totales.neto >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`}></div> Resultado Neto
                </p>
                <p className={`text-3xl font-black ${data.totales.neto >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatCurrency(data.totales.neto)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg p-6 relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <PieChart size={64} />
                </div>
                <p className="text-sm font-bold text-slate-300 mb-1">Margen Global</p>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-black">{margen.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Main Content Grid (Tablas) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Desglose por Sucursal */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Building2 size={18} className="text-blue-500" /> Rendimiento por Sucursal/UN
                  </h3>
                </div>
                <div className="p-0 overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold sticky top-0">
                      <tr>
                        <th className="px-6 py-4">Sucursal</th>
                        <th className="px-6 py-4 text-right">Ingresos</th>
                        <th className="px-6 py-4 text-right">Costos</th>
                        <th className="px-6 py-4 text-right">Neto</th>
                        <th className="px-6 py-4 text-right">Margen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...data.por_unidad]
                        .sort((a, b) => b.neto - a.neto)
                        .map((un: any, idx: number) => {
                          const m = un.ingresos > 0 ? (un.neto / un.ingresos) * 100 : 0;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-700">{un.unidad_negocio}</td>
                              <td className="px-6 py-4 text-right font-medium text-emerald-600">{formatCurrency(un.ingresos)}</td>
                              <td className="px-6 py-4 text-right font-medium text-rose-600">{formatCurrency(un.gastos)}</td>
                              <td className={`px-6 py-4 text-right font-bold ${un.neto >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                {formatCurrency(un.neto)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${m >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                  {m.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Indicadores por Rubro */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 size={18} className="text-purple-500" /> Costos e Ingresos por Rubros
                  </h3>
                </div>
                <div className="p-0 overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold sticky top-0">
                      <tr>
                        <th className="px-6 py-4">Rubro</th>
                        <th className="px-6 py-4 text-right text-emerald-600">Ingresos</th>
                        <th className="px-6 py-4 text-right text-rose-600">Costos</th>
                        <th className="px-6 py-4 text-right">Neto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...data.desglose_categorias]
                        .sort((a, b) => b.neto - a.neto)
                        .map((cat: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-700">{cat.categoria}</td>
                            <td className="px-6 py-4 text-right font-medium text-emerald-600">{cat.ingresos > 0 ? formatCurrency(cat.ingresos) : '-'}</td>
                            <td className="px-6 py-4 text-right font-medium text-rose-600">{cat.gastos > 0 ? formatCurrency(cat.gastos) : '-'}</td>
                            <td className={`px-6 py-4 text-right font-bold ${cat.neto >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatCurrency(cat.neto)}
                            </td>
                          </tr>
                        ))}
                      {data.desglose_categorias.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-sm text-slate-500 text-center py-4">No hay datos de categorías para este período.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Gráfico Ingresos por Rubro */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-[400px]">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                  <PieChart size={18} className="text-emerald-500" /> Distribución de Ingresos
                </h3>
                <ResponsiveContainer width="100%" height="85%">
                  <RePieChart>
                    <Pie
                      data={data.desglose_categorias.filter((c: any) => c.ingresos > 0).sort((a: any, b: any) => b.ingresos - a.ingresos)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="ingresos"
                      nameKey="categoria"
                      label={({ name, percent }: { name: string, percent: number | undefined }) => (percent || 0) > 0.05 ? `${name} ${((percent || 0) * 100).toFixed(0)}%` : ''}
                    >
                      {data.desglose_categorias.filter((c: any) => c.ingresos > 0).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS_INGRESOS[index % COLORS_INGRESOS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico Gastos por Rubro */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-[400px]">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                  <PieChart size={18} className="text-rose-500" /> Distribución de Costos
                </h3>
                <ResponsiveContainer width="100%" height="85%">
                  <RePieChart>
                    <Pie
                      data={data.desglose_categorias.filter((c: any) => c.gastos > 0).sort((a: any, b: any) => b.gastos - a.gastos)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="gastos"
                      nameKey="categoria"
                      label={({ name, percent }: { name: string, percent: number | undefined }) => (percent || 0) > 0.05 ? `${name} ${((percent || 0) * 100).toFixed(0)}%` : ''}
                    >
                      {data.desglose_categorias.filter((c: any) => c.gastos > 0).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS_GASTOS[index % COLORS_GASTOS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico Barras Neto por Sucursal */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-[400px]">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                  <BarChart3 size={18} className="text-blue-500" /> Resultado Neto por Sucursal
                </h3>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={[...data.por_unidad].sort((a, b) => b.neto - a.neto)} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="unidad_negocio" angle={-45} textAnchor="end" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} height={60} />
                    <YAxis tickFormatter={(val: number) => `$${(val/1000000).toFixed(1)}M`} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value))} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="neto" name="Resultado Neto" radius={[4, 4, 0, 0]}>
                      {[...data.por_unidad].sort((a, b) => b.neto - a.neto).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.neto >= 0 ? '#3b82f6' : '#f97316'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
