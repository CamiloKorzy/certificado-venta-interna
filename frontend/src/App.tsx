import React, { useEffect, useState, useMemo } from 'react';
import { Building2, PackageCheck, TrendingUp, FileText, Filter, Calendar, LayoutDashboard, Search, ChevronDown, ChevronUp, ChevronRight, BarChart3, Presentation } from 'lucide-react';

const HorizontalBarChart = ({ title, data, icon: Icon, colorTheme = "blue", showAuthSplit = false }: any) => {
  const themes: any = {
    blue: { bg: "bg-blue-500", text: "text-blue-600", light: "bg-blue-50", icon: "text-blue-600" },
    indigo: { bg: "bg-indigo-500", text: "text-indigo-600", light: "bg-indigo-50", icon: "text-indigo-600" },
    teal: { bg: "bg-teal-500", text: "text-teal-600", light: "bg-teal-50", icon: "text-teal-600" },
    slate: { bg: "bg-slate-600", text: "text-slate-700", light: "bg-slate-100", icon: "text-slate-600" }
  };
  
  const theme = themes[colorTheme] || themes.blue;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 flex flex-col h-full max-h-[500px]">
      <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6 shrink-0">
        <Icon size={20} className={theme.icon} />
        {title}
      </h3>
      <div className="space-y-6 flex-grow overflow-y-auto pr-3 custom-scrollbar">
        {data.map((item: any) => (
          <div key={item.name} className="space-y-2">
            <div className="flex justify-between items-start text-sm gap-4">
              <div className="flex flex-col flex-1">
                <span className="font-medium text-slate-700 leading-snug">{item.name}</span>
                {showAuthSplit && (item.authCount > 0 || item.pendCount > 0) && (
                  <div className="flex gap-1.5 mt-1.5">
                    {item.authCount > 0 && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center leading-none" title="Certificados Autorizados">{item.authCount} Aut.</span>}
                    {item.pendCount > 0 && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 flex items-center leading-none" title="Certificados Pendientes/No Autorizados">{item.pendCount} Pend.</span>}
                  </div>
                )}
              </div>
              <div className="text-right flex flex-col items-end shrink-0 gap-1 mt-0.5">
                <span className="font-bold text-slate-800 leading-none">${item.total.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                <span className={`text-[11px] font-bold ${theme.text} ${theme.light} px-2 py-0.5 rounded leading-none`}>{item.percent.toFixed(1)}%</span>
                <span className="text-[10px] font-medium text-slate-400 leading-none">{item.count} certif.</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`${theme.bg} h-full rounded-full transition-all duration-500`} 
                style={{ width: `${item.percent}%` }}
              ></div>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-4">Sin datos</p>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [rawData, setRawData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const currentYear = new Date().getFullYear();
  const currentPeriod = `${currentMonth}/${currentYear}`;

  // Filters state
  const [filters, setFilters] = useState({
    periodo: currentPeriod,
    empresa: 'Todas',
    unidad: 'Todas',
    concepto: 'Todos',
    estado: 'Todos',
    fechaDesde: '',
    fechaHasta: ''
  });

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [gridFilters, setGridFilters] = useState({
    search: '',
    unidad: 'Todas',
    empresa: 'Todas',
    estado: 'Todos'
  });

  useEffect(() => {
    fetch('/api/indicadores')
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return res.json();
      })
      .then(json => {
        setRawData(json.data || []);
        setColumns(json.columns || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching data:", err);
        setFetchError(err.message);
        setLoading(false);
      });
  }, []);

  // 1. Normalizar los datos para abstraer las diferencias entre DB y Excel
  const normalizedData = useMemo(() => {
    return rawData.map(row => {
      const lowerRow: Record<string, any> = {};
      Object.keys(row).forEach(k => {
        lowerRow[k.toLowerCase()] = row[k];
      });

      // En base a la solicitud, la Unidad de Negocio será el Solicitante (que limpiaremos luego)
      let unidad = lowerRow['cliente'];

      // Extraer importe total
      let total = 0;
      if (lowerRow['total bruto'] !== undefined && lowerRow['total bruto'] !== null && lowerRow['total bruto'] !== '') total = parseFloat(lowerRow['total bruto']);
      else if (lowerRow['total gravado'] !== undefined && lowerRow['total gravado'] !== null && lowerRow['total gravado'] !== '') total = parseFloat(lowerRow['total gravado']);
      else if (lowerRow['total'] !== undefined && lowerRow['total'] !== null && lowerRow['total'] !== '') total = parseFloat(lowerRow['total']);
      else if (lowerRow['gravado'] !== undefined && lowerRow['gravado'] !== null && lowerRow['gravado'] !== '') total = parseFloat(lowerRow['gravado']);
      else if (lowerRow['importe'] !== undefined && lowerRow['importe'] !== null && lowerRow['importe'] !== '') total = parseFloat(lowerRow['importe']);

      // Extraer concepto (Producto)
      let concepto = lowerRow['producto'] || lowerRow['concepto'];
      if (!concepto) {
        concepto = 'Sin Detalle de Concepto';
      }

      // Empresa
      let empresa = lowerRow['empresa'] || 'CEE ENRIQUEZ S.A.';

      // Estado Autorización
      let rawEstado = String(lowerRow['estadoautorizacion'] || lowerRow['estado'] || lowerRow['estadoprocesodetallado'] || 'Desconocido').trim();
      let estadoLabel = 'Pendiente / No Autorizado';
      const rawLower = rawEstado.toLowerCase();
      if (rawLower.includes('autorizado') || rawLower.includes('aprobado') || (rawLower === 'activa' && !lowerRow['estadoautorizacion'])) {
         estadoLabel = 'Autorizado';
      } else if (rawLower.includes('anulado') || rawLower.includes('rechazado')) {
         estadoLabel = 'Rechazado / Anulado';
      }

      // Solicitante / Unidad de Negocio
      let solicitante = lowerRow['solicitante'] || lowerRow['dim. valor'] || 'Sin Equipo Especificado';
      if (typeof solicitante === 'string') {
        solicitante = solicitante.replace(/Certificados? de Ventas? Internas? para /i, '');
        solicitante = solicitante.replace(/Certificados? de Ventas? Internos? para /i, '');
        solicitante = solicitante.replace(/Certificado Venta Interna para /i, '');
        solicitante = solicitante.trim();
      }

      // Reemplazamos la lógica vieja: la Unidad de Negocio AHORA es el Solicitante
      unidad = solicitante || 'General';

      // Extraer periodo de la fecha
      let rawFecha = lowerRow['fecha'] || lowerRow['fechaalta'] || lowerRow['f.comp'] || '';
      let periodoStr = 'Desconocido';
      if (lowerRow['año - mes']) {
        const am = String(lowerRow['año - mes']);
        if (am.includes('-')) {
          periodoStr = `${am.split('-')[1].padStart(2, '0')}/${am.split('-')[0]}`;
        }
      } else if (typeof rawFecha === 'string' && rawFecha.includes('/')) {
        const parts = rawFecha.split('/');
        if (parts.length >= 3) {
          periodoStr = `${parts[1].padStart(2, '0')}/${parts[2]}`;
        }
      }

      return {
        ...row,
        _original: row,
        _empresa: empresa,
        _unidad: unidad,
        _concepto: concepto,
        _estado: estadoLabel,
        _descripcion: String(lowerRow['documentodescripcion'] || lowerRow['descripción'] || lowerRow['descripcion'] || ''),
        _solicitante: solicitante,
        _fecha: lowerRow['fecha'] || lowerRow['fechaalta'] || '',
        _periodo: periodoStr,
        _total: isNaN(total) ? 0 : total,
      };
    });
  }, [rawData]);

  // 2. Extraer opciones únicas para los filtros
  const options = useMemo(() => {
    const empresas = new Set<string>();
    const unidades = new Set<string>();
    const conceptos = new Set<string>();
    const estados = new Set<string>();

    const periodos = new Set<string>();

    normalizedData.forEach(d => {
      if (d._empresa) empresas.add(d._empresa);
      if (d._unidad) unidades.add(d._unidad);
      if (d._concepto) conceptos.add(d._concepto);
      if (d._estado) estados.add(d._estado);
      if (d._periodo && d._periodo !== 'Desconocido') periodos.add(d._periodo);
    });

    // Ordenar periodos de forma descendente YYYYMM
    const sortedPeriodos = Array.from(periodos).sort((a, b) => {
      const [mA, yA] = a.split('/');
      const [mB, yB] = b.split('/');
      return (yB + mB).localeCompare(yA + mA);
    });

    if (!periodos.has(currentPeriod)) {
       sortedPeriodos.unshift(currentPeriod);
    }

    return {
      periodos: ['Todos', ...sortedPeriodos],
      empresas: ['Todas', ...Array.from(empresas).sort()],
      unidades: ['Todas', ...Array.from(unidades).sort()],
      conceptos: ['Todos', ...Array.from(conceptos).sort()],
      estados: ['Todos', ...Array.from(estados).sort()]
    };
  }, [normalizedData]);

  // 3. Aplicar filtros a los datos
  const filteredData = useMemo(() => {
    return normalizedData.filter(d => {
      const matchEmpresa = filters.empresa === 'Todas' || d._empresa === filters.empresa;
      const matchUnidad = filters.unidad === 'Todas' || d._unidad === filters.unidad;
      const matchConcepto = filters.concepto === 'Todos' || d._concepto === filters.concepto;
      const matchEstado = filters.estado === 'Todos' || d._estado === filters.estado;
      const matchPeriodo = filters.periodo === 'Todos' || d._periodo === filters.periodo;
      
      let matchFecha = true;
      if (filters.fechaDesde || filters.fechaHasta) {
        if (filters.fechaDesde && d._fecha && typeof d._fecha === 'string') {
           const dFecha = new Date(d._fecha);
           const fDesde = new Date(filters.fechaDesde);
           if (!isNaN(dFecha.getTime()) && dFecha < fDesde) matchFecha = false;
        }
        if (filters.fechaHasta && d._fecha && typeof d._fecha === 'string') {
           const dFecha = new Date(d._fecha);
           const fHasta = new Date(filters.fechaHasta);
           fHasta.setDate(fHasta.getDate() + 1);
           if (!isNaN(dFecha.getTime()) && dFecha >= fHasta) matchFecha = false;
        }
      }

      return matchEmpresa && matchUnidad && matchConcepto && matchEstado && matchPeriodo && matchFecha;
    });
  }, [normalizedData, filters]);

  // 4. Calcular KPIs basados en datos filtrados
  const kpis = useMemo(() => {
    const autorizados = filteredData.filter(d => d._estado === 'Autorizado').length;
    return {
      movimientos: filteredData.length,
      unidadesActivas: new Set(filteredData.map(d => d._unidad)).size,
      totalValorizado: filteredData.reduce((acc, curr) => acc + curr._total, 0),
      pctAutorizado: filteredData.length > 0 ? (autorizados / filteredData.length) * 100 : 0,
      qtyAutorizados: autorizados
    };
  }, [filteredData]);

  // 5. Agrupaciones para presentacion profesional (Gráficos)
  const agrupaciones = useMemo(() => {
    const byUnidad: Record<string, { ids: Set<string>, authIds: Set<string>, pendIds: Set<string>, total: number }> = {};
    const byEmpresa: Record<string, { ids: Set<string>, authIds: Set<string>, pendIds: Set<string>, total: number }> = {};
    const byConcepto: Record<string, { ids: Set<string>, authIds: Set<string>, pendIds: Set<string>, total: number }> = {};
    const byEstado: Record<string, { ids: Set<string>, authIds: Set<string>, pendIds: Set<string>, total: number }> = {};

    let grandTotal = 0;

    filteredData.forEach((d: any) => {
      grandTotal += d._total;
      const compId = d._original['numerointerno'] || d._original['transaccionid'] || d._original['Comprobante'] || d._original['Documento'] || 'Sin ID';
      const isAuth = d._estado === 'Autorizado';

      const addStat = (record: Record<string, any>, key: string) => {
        if (!record[key]) record[key] = { ids: new Set(), authIds: new Set(), pendIds: new Set(), total: 0 };
        record[key].ids.add(compId);
        if (isAuth) record[key].authIds.add(compId);
        else record[key].pendIds.add(compId);
        record[key].total += d._total;
      };

      addStat(byUnidad, d._unidad);
      addStat(byEmpresa, d._empresa);
      addStat(byConcepto, d._concepto);
      addStat(byEstado, d._estado);
    });

    const formatGroup = (group: Record<string, { ids: Set<string>, authIds: Set<string>, pendIds: Set<string>, total: number }>) => {
      return Object.entries(group)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([name, stats]) => ({
          name,
          count: stats.ids.size,
          authCount: stats.authIds.size,
          pendCount: stats.pendIds.size,
          total: stats.total,
          percent: grandTotal > 0 ? (stats.total / grandTotal) * 100 : 0
        }));
    };

    return {
      unidad: formatGroup(byUnidad),
      empresa: formatGroup(byEmpresa),
      concepto: formatGroup(byConcepto),
      estado: formatGroup(byEstado)
    };
  }, [filteredData]);

  // 6. Agrupación por Comprobante para la Grilla
  const comprobantesData = useMemo(() => {
    const groups: Record<string, any> = {};
    filteredData.forEach(d => {
      const compId = d._original['numerointerno'] || d._original['transaccionid'] || d._original['Comprobante'] || d._original['Documento'] || 'Sin ID';
      if (!groups[compId]) {
        groups[compId] = {
          id: compId,
          fecha: d._fecha,
          cliente: d._original['Cliente'] || d._original['Empresa'] || '-',
          descripcion: d._descripcion,
          unidad: d._unidad,
          estado: d._estado,
          total: 0,
          items: []
        };
      }
      groups[compId].total += d._total;
      groups[compId].items.push(d);
    });
    return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [filteredData]);

  // 7. Filtros locales para la grilla
  const gridOptions = useMemo(() => {
    const unidades = new Set<string>();
    const empresas = new Set<string>();
    const estados = new Set<string>();
    comprobantesData.forEach((c: any) => {
      if (c.unidad) unidades.add(c.unidad);
      if (c.cliente) empresas.add(c.cliente);
      if (c.estado) estados.add(c.estado);
    });
    return {
      unidades: ['Todas', ...Array.from(unidades).sort()],
      empresas: ['Todas', ...Array.from(empresas).sort()],
      estados: ['Todos', ...Array.from(estados).sort()]
    };
  }, [comprobantesData]);

  const filteredGridData = useMemo(() => {
    return comprobantesData.filter((comp: any) => {
      const q = gridFilters.search.toLowerCase();
      const matchSearch = q === '' || 
        comp.id.toLowerCase().includes(q) || 
        comp.descripcion.toLowerCase().includes(q);
      const matchUnidad = gridFilters.unidad === 'Todas' || comp.unidad === gridFilters.unidad;
      const matchEmpresa = gridFilters.empresa === 'Todas' || comp.cliente === gridFilters.empresa;
      const matchEstado = gridFilters.estado === 'Todos' || comp.estado === gridFilters.estado;
      
      return matchSearch && matchUnidad && matchEmpresa && matchEstado;
    });
  }, [comprobantesData, gridFilters]);

  const toggleRow = (id: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRows(newSet);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-medium">Cargando Plataforma de Presentación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-12 overflow-x-hidden">
      {/* Top Navbar */}
      <nav className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl h-14 w-14 flex items-center justify-center shadow-sm">
              <img src="/Negro Fondo Blanco_Logo_CEE ENRIQUEZ.png" alt="CEE ENRIQUEZ" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Certificados de Ventas Internos</h1>
              <p className="text-blue-300 text-xs font-bold tracking-widest uppercase mt-0.5">Dashboard Analítico</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
            <Presentation size={16} className="text-blue-400" />
            <span className="font-medium">Dashboard Analítico</span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        
        {/* Debug Info si está vacío */}
        {filteredData.length === 0 && !loading && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 mb-6 shadow-sm">
            <h3 className="font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div> Modo Diagnóstico de Fallos</h3>
            
            {fetchError ? (
              <div className="mt-3 bg-red-50 text-red-800 border border-red-200 p-3 rounded text-sm font-mono whitespace-pre-wrap">
                <strong>Error de Conexión al Backend (Vercel):</strong><br/>
                {fetchError}
              </div>
            ) : (
              <>
                <p className="text-sm mt-2"><strong>Total de registros crudos en BD:</strong> {rawData.length}</p>
                <p className="text-sm mt-1"><strong>Columnas recibidas de la BD:</strong> {columns.join(', ')}</p>
                <p className="text-sm mt-1"><strong>Filtro aplicado:</strong> Periodo {filters.periodo}</p>
                <div className="mt-3 text-xs bg-white p-3 rounded border border-amber-100 max-h-32 overflow-auto">
                  {rawData.length > 0 ? JSON.stringify(rawData[0]) : "La base de datos no devolvió ningún registro o la conexión falló."}
                </div>
              </>
            )}
          </div>
        )}
        {/* Filters Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
              <Filter size={18} strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Criterios de Análisis</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Periodo</label>
              <select 
                className="w-full border border-slate-300 rounded-lg text-sm bg-slate-50 p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 cursor-pointer"
                value={filters.periodo}
                onChange={e => setFilters({...filters, periodo: e.target.value})}
              >
                {options.periodos.map((o: string) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Prestador</label>
              <select 
                className="w-full border border-slate-300 rounded-lg text-sm bg-slate-50 p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 cursor-pointer"
                value={filters.empresa}
                onChange={e => setFilters({...filters, empresa: e.target.value})}
              >
                {options.empresas.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Unidad de Negocio</label>
              <select 
                className="w-full border border-slate-300 rounded-lg text-sm bg-slate-50 p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 cursor-pointer"
                value={filters.unidad}
                onChange={e => setFilters({...filters, unidad: e.target.value})}
              >
                {options.unidades.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Concepto</label>
              <select 
                className="w-full border border-slate-300 rounded-lg text-sm bg-slate-50 p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 cursor-pointer"
                value={filters.concepto}
                onChange={e => setFilters({...filters, concepto: e.target.value})}
              >
                {options.conceptos.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estado de Autorización</label>
              <select 
                className="w-full border border-slate-300 rounded-lg text-sm bg-slate-50 p-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all font-medium text-slate-700 cursor-pointer"
                value={filters.estado}
                onChange={e => setFilters({...filters, estado: e.target.value})}
              >
                {options.estados.map((o: string) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Desde</label>
                <input 
                  type="date" 
                  className="w-full border border-slate-300 rounded-lg text-sm bg-slate-50 p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                  value={filters.fechaDesde}
                  onChange={e => setFilters({...filters, fechaDesde: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hasta</label>
                <input 
                  type="date" 
                  className="w-full border border-slate-300 rounded-lg text-sm bg-slate-50 p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                  value={filters.fechaHasta}
                  onChange={e => setFilters({...filters, fechaHasta: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* KPIs Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-7 rounded-2xl shadow-lg text-white relative overflow-hidden flex flex-col justify-center">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={20} className="text-emerald-400" />
                <p className="text-slate-300 text-xs font-bold uppercase tracking-wider">Total Consolidado</p>
              </div>
              <h3 className="text-4xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm truncate" title={'$' + kpis.totalValorizado.toLocaleString('es-AR', { maximumFractionDigits: 0 })}>
                ${kpis.totalValorizado.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
              </h3>
            </div>
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:border-blue-200 transition-colors">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><FileText size={32} /></div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Volumen Operativo</p>
              <h3 className="text-3xl font-bold text-slate-800">{comprobantesData.length} <span className="text-sm font-medium text-slate-400">comprob.</span></h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:border-blue-200 transition-colors">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Building2 size={32} /></div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Alcance</p>
              <h3 className="text-3xl font-bold text-slate-800">{kpis.unidadesActivas} <span className="text-sm font-medium text-slate-400">unidades</span></h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:border-amber-200 transition-colors relative overflow-hidden">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl z-10"><Presentation size={32} /></div>
            <div className="z-10">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Autorizados</p>
              <h3 className="text-3xl font-bold text-slate-800">{kpis.pctAutorizado.toFixed(0)}% <span className="text-sm font-medium text-slate-400">({kpis.qtyAutorizados})</span></h3>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-amber-500 transition-all" style={{width: `${kpis.pctAutorizado}%`}}></div>
          </div>
        </div>

        {/* Gráficos de Distribución */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <HorizontalBarChart title="Estado Autorización" data={agrupaciones.estado} icon={Filter} colorTheme="amber" />
          <HorizontalBarChart title="Por Concepto" data={agrupaciones.concepto} icon={PackageCheck} colorTheme="indigo" />
          <HorizontalBarChart title="Por Prestador" data={agrupaciones.empresa} icon={Building2} colorTheme="slate" />
          <HorizontalBarChart title="Por Unidad de Negocio" data={agrupaciones.unidad} icon={BarChart3} colorTheme="teal" showAuthSplit={true} />
        </div>

        {/* Data Table - Grilla Detalle */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <LayoutDashboard size={20} className="text-blue-600" />
              Comprobantes Emitidos
            </h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-200 px-3 py-1 rounded-full">{filteredGridData.length} resultados</span>
          </div>
          
          {/* Filtros Locales de la Grilla */}
          <div className="p-4 border-b border-slate-100 bg-white grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar comprobante o descripción..."
                className="w-full border border-slate-200 rounded-lg text-sm bg-slate-50 py-2.5 pl-9 pr-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 placeholder-slate-400"
                value={gridFilters.search}
                onChange={e => setGridFilters({...gridFilters, search: e.target.value})}
              />
            </div>
            <div>
              <select 
                className="w-full border border-slate-200 rounded-lg text-sm bg-slate-50 p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 cursor-pointer"
                value={gridFilters.unidad}
                onChange={e => setGridFilters({...gridFilters, unidad: e.target.value})}
              >
                <option value="Todas">Unidad: Todas</option>
                {gridOptions.unidades.filter(o => o !== 'Todas').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <select 
                className="w-full border border-slate-200 rounded-lg text-sm bg-slate-50 p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 cursor-pointer"
                value={gridFilters.empresa}
                onChange={e => setGridFilters({...gridFilters, empresa: e.target.value})}
              >
                <option value="Todas">Prestador: Todos</option>
                {gridOptions.empresas.filter(o => o !== 'Todas').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <select 
                className="w-full border border-slate-200 rounded-lg text-sm bg-slate-50 p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 cursor-pointer"
                value={gridFilters.estado}
                onChange={e => setGridFilters({...gridFilters, estado: e.target.value})}
              >
                <option value="Todos">Estado: Todos</option>
                {gridOptions.estados.filter(o => o !== 'Todos').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200">
                  <th className="px-6 py-4 w-12 text-center"></th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">Fecha</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">Comprobante</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">Descripción</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">Unidad de Negocio</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">Prestador</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50 text-right">Total Consolidado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGridData.map((comp: any) => {
                  const isExpanded = expandedRows.has(comp.id);
                  return (
                    <React.Fragment key={comp.id}>
                      <tr 
                        className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/30' : ''}`}
                        onClick={() => toggleRow(comp.id)}
                      >
                        <td className="px-6 py-4 text-slate-400 text-center">
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{comp.fecha}</td>
                        <td className="px-6 py-4 text-sm"><span className="text-slate-900 font-bold bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">{comp.id}</span></td>
                        <td className="px-6 py-4 text-sm text-slate-600 truncate max-w-[200px]" title={comp.descripcion}>{comp.descripcion}</td>
                        <td className="px-6 py-4 text-sm text-slate-700 max-w-[150px] font-bold truncate" title={comp.unidad}>{comp.unidad}</td>
                        <td className="px-6 py-4 text-sm text-slate-700 font-medium truncate max-w-xs">{comp.cliente}</td>
                        <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded text-xs font-bold border ${comp.estado === 'Autorizado' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-amber-700 bg-amber-50 border-amber-100'}`}>{comp.estado}</span></td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">${comp.total.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                      </tr>
                      
                      {/* Fila Expandible con Detalle */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="bg-slate-50/80 p-0 border-b border-slate-200">
                            <div className="px-14 py-4">
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <PackageCheck size={14} /> Ítems del Comprobante
                              </h4>
                              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse text-sm">
                                  <thead>
                                    <tr className="bg-slate-100/50 border-b border-slate-200">
                                      <th className="px-4 py-2 font-medium text-slate-500">Producto / Concepto</th>
                                      <th className="px-4 py-2 font-medium text-slate-500 text-right">Cant.</th>
                                      <th className="px-4 py-2 font-medium text-slate-500 text-right">Precio Unit.</th>
                                      <th className="px-4 py-2 font-medium text-slate-500 text-right">Importe</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {comp.items.map((item: any, idx: number) => {
                                      const row = item._original;
                                      const producto = row['Producto'] || row['Concepto'] || '-';
                                      const cantidad = parseFloat(row['Cantidad']) || 1;
                                      const precio = parseFloat(row['Precio']) || 0;
                                      const importe = item._total;
                                      
                                      return (
                                        <tr key={idx} className="hover:bg-slate-50">
                                          <td className="px-4 py-3 text-slate-700 font-medium">{producto}</td>
                                          <td className="px-4 py-3 text-slate-600 text-right">{cantidad.toLocaleString('es-AR')} {row['Unidad'] || ''}</td>
                                          <td className="px-4 py-3 text-slate-600 text-right">${precio.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                                          <td className="px-4 py-3 text-slate-800 font-bold text-right">${importe.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {filteredGridData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-medium">
                      <Search size={40} className="mx-auto text-slate-300 mb-3" />
                      Sin resultados. Ajuste los filtros para ver más información.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
