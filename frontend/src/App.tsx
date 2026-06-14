import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Building2, PackageCheck, TrendingUp, FileText, Filter, Calendar, LayoutDashboard, Search, ChevronDown, ChevronUp, ChevronRight, BarChart3, Presentation, Download, LogOut, Settings, Users, Save, X, Trash2, Edit2, Send, Check, Loader2, Shield, Bell, Wallet } from 'lucide-react';
import ConfiguracionAvanzada from './components/ConfiguracionAvanzada';
import ConfiguracionCentrosCosto from './components/ConfiguracionCentrosCosto';
import InformeGestion from './components/InformeGestion';
// ─── API Helper ───
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

const MultiSelect = ({ label, options, selected, onChange }: { label: string, options: string[], selected: string[], onChange: (v: string[]) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (option === 'Todos' || option === 'Todas') {
      onChange([option]);
      return;
    }
    
    let newSelected = selected.filter(s => s !== 'Todos' && s !== 'Todas');
    if (newSelected.includes(option)) {
      newSelected = newSelected.filter(s => s !== option);
    } else {
      newSelected.push(option);
    }
    
    if (newSelected.length === 0) {
      newSelected = [options[0]]; // fallback to Todos/Todas
    }
    
    onChange(newSelected);
  };

  const displayText = (selected.includes('Todos') || selected.includes('Todas')) 
    ? options[0] 
    : (selected.length === 1 ? selected[0] : `${selected.length} seleccionados`);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
      <div 
        className="w-full flex items-center justify-between border border-slate-300 rounded-lg text-sm bg-slate-50 p-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all font-medium text-slate-700 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate pr-2">{displayText}</span>
        {isOpen ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {options.map((option, idx) => (
            <div 
              key={idx} 
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => toggleOption(option)}
            >
              <div className={`w-4 h-4 rounded flex items-center justify-center border ${selected.includes(option) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                {selected.includes(option) && <Check size={12} className="text-white" />}
              </div>
              <span className="text-sm text-slate-700 truncate">{option}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const HorizontalBarChart = ({ title, data, icon: Icon, colorTheme = "blue", showAuthSplit = false, countLabel = "certif." }: any) => {
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
                <span className="text-[10px] font-medium text-slate-400 leading-none">{typeof item.qty === 'number' ? `${item.qty.toLocaleString('es-AR')} uds.` : `${item.count} certif.`}</span>
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

function Dashboard({ token, onLogout }: { token: string, onLogout: () => void }) {
  const [rawData, setRawData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const currentYear = new Date().getFullYear();
  const currentPeriod = `${currentMonth}/${currentYear}`;

  // Filters state (Pending - modified by UI)
  const [pendingFilters, setPendingFilters] = useState({
    periodo: [currentPeriod],
    empresa: ['Todas'],
    cliente: ['Todos'],
    unidad: ['Todas'],
    concepto: ['Todos'],
    estado: ['Todos'],
    fechaDesde: '',
    fechaHasta: ''
  });

  // Filters state (Applied - used for data filtering)
  const [appliedFilters, setAppliedFilters] = useState(pendingFilters);

  const applyFilters = () => {
    setAppliedFilters(pendingFilters);
  };

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [gridFilters, setGridFilters] = useState({
    search: '',
    unidad: 'Todas',
    empresa: 'Todas',
    cliente: 'Todos',
    estado: 'Todos'
  });

  useEffect(() => {
    apiFetch('/api/indicadores', token)
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
  }, [token]);

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
      const parseAmount = (val: any) => {
        if (val === undefined || val === null || val === '') return 0;
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          // El backend envía valores como "447700.0" (punto = decimal)
          // Si tiene comas como separador de miles (ej: "1.234.567,50"), convertir
          if (val.includes(',') && val.includes('.')) {
            // Formato argentino: 1.234.567,50
            let cleaned = val.replace(/\./g, '').replace(/,/g, '.');
            return parseFloat(cleaned) || 0;
          } else if (val.includes(',') && !val.includes('.')) {
            // Solo coma decimal: 447700,50
            return parseFloat(val.replace(',', '.')) || 0;
          }
          // Formato estándar: 447700.0 o 447700
          return parseFloat(val) || 0;
        }
        return 0;
      };

      if (lowerRow['total bruto'] !== undefined && parseAmount(lowerRow['total bruto']) !== 0) total = parseAmount(lowerRow['total bruto']);
      else if (lowerRow['total gravado'] !== undefined && parseAmount(lowerRow['total gravado']) !== 0) total = parseAmount(lowerRow['total gravado']);
      else if (lowerRow['total'] !== undefined && parseAmount(lowerRow['total']) !== 0) total = parseAmount(lowerRow['total']);
      else if (lowerRow['gravado'] !== undefined && parseAmount(lowerRow['gravado']) !== 0) total = parseAmount(lowerRow['gravado']);
      else if (lowerRow['importe'] !== undefined && parseAmount(lowerRow['importe']) !== 0) total = parseAmount(lowerRow['importe']);


      // Extraer concepto (Producto principal)
      let concepto = lowerRow['producto'] || lowerRow['concepto'];
      if (!concepto) {
        concepto = 'Sin Detalle de Concepto';
      }

      // Extraer items para poder filtrar por múltiples productos dentro de un mismo certificado
      let items = lowerRow['items'] || {};
      let todosLosConceptos = new Set<string>();
      if (typeof items === 'object' && items !== null) {
        Object.values(items).forEach((it: any) => {
           if (it.Producto) todosLosConceptos.add(it.Producto);
        });
      }
      if (todosLosConceptos.size === 0) {
        todosLosConceptos.add(concepto);
      }

      // Empresa (Prestador / Sucursal)
      let empresa = lowerRow['empresa'] || lowerRow['unidadnegocio'] || 'CEE ENRIQUEZ S.A.';

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
        _cliente_empresa: lowerRow['cliente'] || 'Sin Cliente',
        _unidad: unidad,
        _concepto: concepto,
        _todosLosConceptos: Array.from(todosLosConceptos),
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
    const clientes = new Set<string>();
    const unidades = new Set<string>();
    const conceptos = new Set<string>();
    const estados = new Set<string>();

    const periodos = new Set<string>();

    normalizedData.forEach(d => {
      if (d._empresa) empresas.add(d._empresa);
      if (d._cliente_empresa) clientes.add(d._cliente_empresa);
      if (d._unidad) unidades.add(d._unidad);
      if (d._todosLosConceptos) {
        d._todosLosConceptos.forEach((c: string) => conceptos.add(c));
      } else if (d._concepto) conceptos.add(d._concepto);
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
      clientes: ['Todos', ...Array.from(clientes).sort()],
      unidades: ['Todas', ...Array.from(unidades).sort()],
      conceptos: ['Todos', ...Array.from(conceptos).sort()],
      estados: ['Todos', ...Array.from(estados).sort()]
    };
  }, [normalizedData]);

  // 3. Aplicar filtros a los datos
  const filteredData = useMemo(() => {
    const f = appliedFilters;
    const rawFiltered = normalizedData.filter(d => {
      const matchEmpresa = f.empresa.includes('Todas') || f.empresa.includes(d._empresa);
      const matchCliente = f.cliente.includes('Todos') || f.cliente.includes(d._cliente_empresa);
      const matchUnidad = f.unidad.includes('Todas') || f.unidad.includes(d._unidad);
      
      const matchConcepto = f.concepto.includes('Todos') || 
        (d._todosLosConceptos && d._todosLosConceptos.some((c: string) => f.concepto.includes(c))) || 
        f.concepto.includes(d._concepto);

      const matchEstado = f.estado.includes('Todos') || f.estado.includes(d._estado);
      const matchPeriodo = f.periodo.includes('Todos') || f.periodo.includes(d._periodo);
      
      let matchFecha = true;
      if (f.fechaDesde || f.fechaHasta) {
        if (f.fechaDesde && d._fecha && typeof d._fecha === 'string') {
           const dFecha = new Date(d._fecha);
           const fDesde = new Date(f.fechaDesde);
           if (!isNaN(dFecha.getTime()) && dFecha < fDesde) matchFecha = false;
        }
        if (f.fechaHasta && d._fecha && typeof d._fecha === 'string') {
           const dFecha = new Date(d._fecha);
           const fHasta = new Date(f.fechaHasta);
           fHasta.setDate(fHasta.getDate() + 1);
           if (!isNaN(dFecha.getTime()) && dFecha >= fHasta) matchFecha = false;
        }
      }

      return matchEmpresa && matchCliente && matchUnidad && matchConcepto && matchEstado && matchPeriodo && matchFecha;
    });
    
    return rawFiltered;
  }, [normalizedData, appliedFilters]);

  // 5. Datos de Comprobantes - El backend ya entrega 1 registro = 1 comprobante
  const comprobantesData = useMemo(() => {
    return filteredData.map(d => ({
      id: d._original['Comprobante'] || d._original['comprobante'] || 'Sin ID',
      fecha: d._fecha,
      prestador: d._empresa || d._original['Empresa'] || '-',
      clienteEmpresa: d._cliente_empresa || '-',
      descripcion: d._descripcion,
      unidad: d._unidad,
      estado: d._estado,
      total: d._total,
      items: d._original['items'] || []   // Items embebidos del backend
    })).sort((a, b) => b.total - a.total);
  }, [filteredData]);

  // 6. KPIs y Métricas Globales
  const kpis = useMemo(() => {
    const autorizados = comprobantesData.filter(c => c.estado === 'Autorizado').length;
    let totalConsolidado = 0;
    let netoGravado = 0;
    let iva = 0;
    
    filteredData.forEach(d => {
      totalConsolidado += d._total;
      
      // Parsear Neto Gravado e IVA del backend
      const parseNum = (val: any) => {
        if (!val || val === '' || val === 'undefined') return 0;
        return parseFloat(String(val)) || 0;
      };
      const lowerRow: Record<string, any> = {};
      Object.keys(d._original).forEach(k => { lowerRow[k.toLowerCase()] = d._original[k]; });
      netoGravado += parseNum(lowerRow['neto gravado']);
      iva += parseNum(lowerRow['iva']);
    });

    return {
      totalConsolidado,
      netoGravado,
      iva,
      volumenOperativo: comprobantesData.length,
      alcance: new Set(filteredData.map(d => d._unidad)).size,
      pctAutorizado: comprobantesData.length > 0 ? (autorizados / comprobantesData.length) * 100 : 0,
      qtyAutorizados: autorizados
    };
  }, [comprobantesData, filteredData]);

  // 6.5 Agrupaciones para presentacion profesional (Gráficos)
  const agrupaciones = useMemo(() => {
    type GroupStats = { ids: Set<string>, authIds: Set<string>, pendIds: Set<string>, total: number, qty?: number };
    const byUnidad: Record<string, GroupStats> = {};
    const byEmpresa: Record<string, GroupStats> = {};
    const byCliente: Record<string, GroupStats> = {};
    const byConcepto: Record<string, GroupStats> = {};
    const byEstado: Record<string, GroupStats> = {};

    let grandTotal = 0;

    comprobantesData.forEach((comp: any) => {
      grandTotal += comp.total;
      const isAuth = comp.estado === 'Autorizado';

      const addStat = (record: Record<string, any>, key: string) => {
        if (!record[key]) record[key] = { ids: new Set(), authIds: new Set(), pendIds: new Set(), total: 0 };
        record[key].ids.add(comp.id);
        if (isAuth) record[key].authIds.add(comp.id);
        else record[key].pendIds.add(comp.id);
        record[key].total += comp.total;
      };

      addStat(byUnidad, comp.unidad);
      addStat(byEmpresa, comp.prestador);
      addStat(byCliente, comp.clienteEmpresa);
      
      // Por concepto: usar los ítems embebidos con su importe individual
      const items = comp.items || [];
      if (items.length === 0) {
        addStat(byConcepto, 'Sin Detalle de Concepto');
      } else {
        items.forEach((item: any) => {
          const nombre = item.Producto || item.producto || 'Sin Detalle';
          const itemImporte = Number(item.Importe || item.importe || 0);
          if (!byConcepto[nombre]) byConcepto[nombre] = { ids: new Set(), authIds: new Set(), pendIds: new Set(), total: 0, qty: 0 };
          const entry = byConcepto[nombre];
          entry.qty = (entry.qty || 0) + Number(item.Cantidad || item.cantidad || 0);
          entry.ids.add(comp.id);
          if (isAuth) entry.authIds.add(comp.id);
          else entry.pendIds.add(comp.id);
          entry.total += itemImporte;
        });
      }
      
      addStat(byEstado, comp.estado);
    });

    const formatGroup = (group: Record<string, GroupStats>) => {
      return Object.entries(group)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([name, stats]) => ({
          name,
          count: stats.ids.size,
          authCount: stats.authIds.size,
          pendCount: stats.pendIds.size,
          total: stats.total,
          percent: grandTotal > 0 ? (stats.total / grandTotal) * 100 : 0,
          qty: stats.qty != null ? stats.qty : undefined
        }));
    };

    return {
      unidad: formatGroup(byUnidad),
      empresa: formatGroup(byEmpresa),
      cliente: formatGroup(byCliente),
      concepto: formatGroup(byConcepto),
      estado: formatGroup(byEstado)
    };
  }, [comprobantesData]);

  // 7. Filtros locales para la grilla
  const gridOptions = useMemo(() => {
    const unidades = new Set<string>();
    const empresas = new Set<string>();
    const clientes = new Set<string>();
    const estados = new Set<string>();
    comprobantesData.forEach((c: any) => {
      if (c.unidad) unidades.add(c.unidad);
      if (c.prestador) empresas.add(c.prestador);
      if (c.clienteEmpresa) clientes.add(c.clienteEmpresa);
      if (c.estado) estados.add(c.estado);
    });
    return {
      unidades: ['Todas', ...Array.from(unidades).sort()],
      empresas: ['Todas', ...Array.from(empresas).sort()],
      clientes: ['Todos', ...Array.from(clientes).sort()],
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
      const matchEmpresa = gridFilters.empresa === 'Todas' || comp.prestador === gridFilters.empresa;
      const matchCliente = gridFilters.cliente === 'Todos' || comp.clienteEmpresa === gridFilters.cliente;
      const matchEstado = gridFilters.estado === 'Todos' || comp.estado === gridFilters.estado;
      
      return matchSearch && matchUnidad && matchEmpresa && matchCliente && matchEstado;
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
              <img src="/logo_cee.png" alt="CEE ENRIQUEZ" className="h-full w-full object-contain" />
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
        

        {/* Filters Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
              <Filter size={18} strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Criterios de Análisis</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <MultiSelect 
              label="Periodo" 
              options={options.periodos} 
              selected={pendingFilters.periodo} 
              onChange={v => setPendingFilters({...pendingFilters, periodo: v})} 
            />
            <MultiSelect 
              label="Prestador/Sucursal" 
              options={options.empresas} 
              selected={pendingFilters.empresa} 
              onChange={v => setPendingFilters({...pendingFilters, empresa: v})} 
            />
            <MultiSelect 
              label="Cliente Empresa" 
              options={options.clientes} 
              selected={pendingFilters.cliente} 
              onChange={v => setPendingFilters({...pendingFilters, cliente: v})} 
            />
            <MultiSelect 
              label="Cliente UN" 
              options={options.unidades} 
              selected={pendingFilters.unidad} 
              onChange={v => setPendingFilters({...pendingFilters, unidad: v})} 
            />
            <MultiSelect 
              label="Producto" 
              options={options.conceptos} 
              selected={pendingFilters.concepto} 
              onChange={v => setPendingFilters({...pendingFilters, concepto: v})} 
            />
            <MultiSelect 
              label="Estado de Autorización" 
              options={options.estados} 
              selected={pendingFilters.estado} 
              onChange={v => setPendingFilters({...pendingFilters, estado: v})} 
            />
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mt-5">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex-1 max-w-lg flex items-center gap-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 w-24 border-r border-slate-200 pr-3">Fechas</label>
              <div className="flex items-center gap-3 w-full">
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Desde</label>
                  <input 
                    type="date" 
                    className="w-full border border-slate-300 rounded-lg text-sm bg-white p-2 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                    value={pendingFilters.fechaDesde}
                    onChange={e => setPendingFilters({...pendingFilters, fechaDesde: e.target.value})}
                  />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Hasta</label>
                  <input 
                    type="date" 
                    className="w-full border border-slate-300 rounded-lg text-sm bg-white p-2 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                    value={pendingFilters.fechaHasta}
                    onChange={e => setPendingFilters({...pendingFilters, fechaHasta: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <button 
              onClick={applyFilters}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
            >
              <Search size={18} />
              Actualizar Resultados
            </button>
          </div>
        </div>

        {/* KPIs Summary - Financial Banner */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-blue-400" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Neto Gravado</p>
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                ${kpis.netoGravado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-amber-400" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">IVA (21%)</p>
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-amber-300">
                ${kpis.iva.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-emerald-400" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Consolidado</p>
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-emerald-300">
                ${kpis.totalConsolidado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
          <div className="absolute -left-10 -top-10 w-32 h-32 bg-blue-500 opacity-5 rounded-full blur-2xl"></div>
        </div>
        
        {/* KPIs Operativos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <h3 className="text-3xl font-bold text-slate-800">{kpis.alcance} <span className="text-sm font-medium text-slate-400">unidades</span></h3>
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
          <HorizontalBarChart title="Por Producto" data={agrupaciones.concepto} icon={PackageCheck} colorTheme="indigo" />
          <HorizontalBarChart title="Por Prestador" data={agrupaciones.empresa} icon={Building2} colorTheme="slate" />
          <HorizontalBarChart title="Por Cliente Empresa" data={agrupaciones.cliente} icon={Building2} colorTheme="blue" />
          <HorizontalBarChart title="Por Cliente UN" data={agrupaciones.unidad} icon={BarChart3} colorTheme="teal" showAuthSplit={true} />
        </div>

        {/* Data Table - Grilla Detalle */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <LayoutDashboard size={20} className="text-blue-600" />
              Comprobantes Emitidos
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 bg-slate-200 px-3 py-1 rounded-full">{filteredGridData.length} resultados</span>
              <button
                onClick={() => {
                  // Generar Excel XML Spreadsheet
                  const rows = filteredGridData.map((comp: any) => ({
                    'Fecha': comp.fecha,
                    'Comprobante': comp.id,
                    'Descripción': comp.descripcion,
                    'Cliente UN': comp.unidad,
                    'Prestador': comp.prestador,
                    'Cliente Empresa': comp.clienteEmpresa,
                    'Estado': comp.estado,
                    'Neto Gravado': (comp.total / 1.21),
                    'IVA 21%': comp.total - (comp.total / 1.21),
                    'Total': comp.total,
                  }));
                  const headers = Object.keys(rows[0] || {});
                  const escXml = (v: any) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
                  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Excel.Sheet"?>\n';
                  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
                  xml += '<Styles><Style ss:ID="hdr"><Font ss:Bold="1" ss:Size="11"/><Interior ss:Color="#1E293B" ss:Pattern="Solid"/><Font ss:Color="#FFFFFF" ss:Bold="1" ss:Size="11"/></Style>';
                  xml += '<Style ss:ID="cur"><NumberFormat ss:Format="$#,##0.00"/></Style>';
                  xml += '<Style ss:ID="def"><Font ss:Size="10"/></Style></Styles>\n';
                  xml += '<Worksheet ss:Name="Comprobantes Emitidos"><Table>\n';
                  // Column widths
                  [100, 180, 300, 200, 280, 280, 140, 150, 150, 150].forEach(w => { xml += `<Column ss:Width="${w}"/>\n`; });
                  // Header row
                  xml += '<Row ss:Height="30">';
                  headers.forEach(h => { xml += `<Cell ss:StyleID="hdr"><Data ss:Type="String">${escXml(h)}</Data></Cell>`; });
                  xml += '</Row>\n';
                  // Data rows
                  rows.forEach(row => {
                    xml += '<Row>';
                    headers.forEach(h => {
                      const val = (row as any)[h];
                      if (typeof val === 'number') {
                        xml += `<Cell ss:StyleID="cur"><Data ss:Type="Number">${val.toFixed(2)}</Data></Cell>`;
                      } else {
                        xml += `<Cell ss:StyleID="def"><Data ss:Type="String">${escXml(val)}</Data></Cell>`;
                      }
                    });
                    xml += '</Row>\n';
                  });
                  xml += '</Table></Worksheet></Workbook>';
                  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Comprobantes_Emitidos_${new Date().toISOString().slice(0,10)}.xls`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                <Download size={14} />
                Descargar XLSX
              </button>
            </div>
          </div>
          
          {/* Filtros Locales de la Grilla */}
          <div className="p-4 border-b border-slate-100 bg-white grid grid-cols-1 md:grid-cols-5 gap-4">
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
                <option value="Todas">Cliente UN: Todos</option>
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
                value={gridFilters.cliente}
                onChange={e => setGridFilters({...gridFilters, cliente: e.target.value})}
              >
                <option value="Todos">Cliente Empresa: Todos</option>
                {gridOptions.clientes.filter((o: string) => o !== 'Todos').map((o: string) => <option key={o} value={o}>{o}</option>)}
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
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50 text-right pl-12">Total Consolidado</th>
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
                        <td className="px-6 py-4 text-sm text-slate-700 font-bold" title={comp.unidad}>{comp.unidad}</td>
                        <td className="px-6 py-4 text-sm text-slate-700 font-medium truncate max-w-xs">{comp.cliente}</td>
                        <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded text-xs font-bold border ${comp.estado === 'Autorizado' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-amber-700 bg-amber-50 border-amber-100'}`}>{comp.estado}</span></td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right pl-12 whitespace-nowrap">${comp.total.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
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
                                      const producto = item.Producto || item.producto || '-';
                                      const cantidad = item.Cantidad || item.cantidad || 1;
                                      const precio = item.Precio || item.precio || 0;
                                      const importe = item.Importe || item.importe || 0;
                                      const unidadItem = item.Unidad || item.unidad || '';
                                      
                                      return (
                                        <tr key={idx} className="hover:bg-slate-50">
                                          <td className="px-4 py-3 text-slate-700 font-medium">{producto}</td>
                                          <td className="px-4 py-3 text-slate-600 text-right">{Number(cantidad).toLocaleString('es-AR')} {unidadItem}</td>
                                          <td className="px-4 py-3 text-slate-600 text-right">${Number(precio).toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                                          <td className="px-4 py-3 text-slate-800 font-bold text-right">${Number(importe).toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
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

// ═══════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════
function LoginScreen({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) { 
        const text = await res.text();
        let msg = `Error ${res.status}`;
        try { const d = JSON.parse(text); msg = d.detail || d.error || msg; } catch { msg += `: ${text.substring(0, 150)}`; }
        throw new Error(msg); 
      }
      const data = await res.json();
      onLogin(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo_cee.png" alt="CEE ENRIQUEZ" className="w-24 h-24 mx-auto mb-4 rounded-2xl shadow-lg shadow-blue-600/20" />
          <h1 className="text-2xl font-bold text-white">Reporte de Resultados</h1>
          <p className="text-blue-300/70 text-sm mt-1">Panel de Gestión</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-300/40 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="usuario@ceeenriquez.com" />
            </div>
            <div>
              <label className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1.5 block">Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-300/40 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="••••••••" />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mt-3 font-medium bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CONFIGURACIÓN — GESTIÓN DE USUARIOS Y UNIDADES
// ═══════════════════════════════════════════════════════
const ROLES_MAP: Record<string, string> = { admin: 'Administrador', responsable_un: 'Responsable U.N.', consulta: 'Solo Consulta' };

function Configuracion({ token }: { token: string }) {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>({ id: null, nombre: '', email: '', password: '', rol: 'consulta', telegram_chat_id: '', activo: 1 });
  const [editing, setEditing] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [modalUser, setModalUser] = useState<any>(null);
  const [userUnidades, setUserUnidades] = useState<any[]>([]);
  const [savingUn, setSavingUn] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMsg, setModalMsg] = useState({ text: '', type: '' });
  const [configTab, setConfigTab] = useState<'usuarios' | 'audit' | 'ingresos' | 'gastos-asientos' | 'gastos-compras' | 'centros-costo' | 'unidades' | 'ajustes-excel'>('usuarios');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [searchUnidad, setSearchUnidad] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    apiFetch('/api/usuarios', token).then(r => setUsuarios(r.data || [])).catch(console.error).finally(() => setLoading(false));
  }, [token]);
  
  const loadAudit = useCallback(() => {
    setAuditLoading(true);
    apiFetch('/api/audit-logs', token).then(r => setAuditLogs(r.data || [])).catch(console.error).finally(() => setAuditLoading(false));
  }, [token]);

  useEffect(() => {
    if (configTab === 'usuarios') load();
    else if (configTab === 'audit') loadAudit();
  }, [configTab, load, loadAudit]);

  const resetForm = () => { setForm({ id: null, nombre: '', email: '', password: '', rol: 'consulta', telegram_chat_id: '', activo: 1 }); setEditing(false); setErrorMsg(''); };

  const saveUser = async () => {
    setErrorMsg('');
    if (!form.email || !form.nombre) return setErrorMsg('Complete Nombre y Email');
    if (!form.id && !form.password) return setErrorMsg('Contraseña requerida para nuevo usuario');
    try {
      if (form.id) {
        await apiFetch(`/api/usuarios/${form.id}`, token, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await apiFetch('/api/usuarios', token, { method: 'POST', body: JSON.stringify(form) });
      }
      setSaveMsg('✅ Usuario guardado'); setTimeout(() => setSaveMsg(''), 3000);
      load(); resetForm();
    } catch (e: any) { setErrorMsg('Error: ' + e.message); }
  };

  const deleteUser = async (id: number) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    await apiFetch(`/api/usuarios/${id}`, token, { method: 'DELETE' }).catch(console.error);
    load();
  };

  const testTelegram = async (id: number) => {
    try {
      const r = await apiFetch(`/api/telegram-test/${id}`, token, { method: 'POST' });
      if (r.ok) {
        setSaveMsg('✅ Mensaje enviado a Telegram'); setTimeout(() => setSaveMsg(''), 3000);
      } else {
        setErrorMsg('❌ Error: ' + (r.error || 'desconocido')); setTimeout(() => setErrorMsg(''), 4000);
      }
    } catch (e: any) { setErrorMsg('Error: ' + e.message); setTimeout(() => setErrorMsg(''), 4000); }
  };

  const openUnidades = async (u: any) => {
    setModalUser(u); setModalLoading(true); setModalMsg({ text: '', type: '' });
    try {
      const [baseRes, userRes] = await Promise.all([
        apiFetch('/api/unidades-negocio', token),
        apiFetch(`/api/usuarios/${u.id}/unidades`, token)
      ]);
      
      // Verificar errores explícitos del backend
      if (baseRes.error) {
        setModalMsg({ text: `❌ Aurora DB: ${baseRes.error}${baseRes.trace ? '\n' + baseRes.trace : ''}`, type: 'error' });
        setUserUnidades([]);
        setModalLoading(false);
        return;
      }
      if (userRes.error) {
        setModalMsg({ text: `❌ Supabase DB: ${userRes.error}`, type: 'error' });
        setUserUnidades([]);
        setModalLoading(false);
        return;
      }
      
      const base: string[] = baseRes.data || [];
      const userInfo: any[] = userRes.data || [];
      
      if (base.length === 0) {
        setModalMsg({ text: '⚠️ Aurora no devolvió unidades de negocio. Verificar tabla ceesa_cee_sucursales en producción.', type: 'error' });
      }
      
      setUserUnidades(base.map((un: any) => {
        const sucursalName = typeof un === 'string' ? un : un.sucursal;
        const empresaPadre = typeof un === 'string' ? '' : un.empresa_padre;
        const isEquipo = empresaPadre === 'Equipos Solicitantes';
        const display = sucursalName;
        
        const existing = userInfo.find((e: any) => String(e.unidad_negocio).trim() === String(sucursalName).trim());
        return existing 
          ? { ...existing, unidad_negocio: sucursalName, display_name: display, is_equipo: isEquipo, empresa_padre: empresaPadre, acceso: true } 
          : { unidad_negocio: sucursalName, display_name: display, is_equipo: isEquipo, empresa_padre: empresaPadre, acceso: false };
      }));
    } catch (e: any) { 
      console.error(e); 
      setModalMsg({ text: '❌ Error de conexión: ' + e.message, type: 'error' });
      setUserUnidades([]);
    }
    setModalLoading(false);
  };

  const toggleUn = (id_unidad: string, field: string) => {
    setUserUnidades(prev => prev.map(u => u.unidad_negocio === id_unidad ? { ...u, [field]: !u[field] } : u));
  };

  const toggleAll = (field: string, filteredIds: string[]) => {
    if (filteredIds.length === 0) return;
    const filteredUnidades = userUnidades.filter((u: any) => filteredIds.includes(u.unidad_negocio));
    const allChecked = filteredUnidades.every((u: any) => u[field]);
    const newValue = !allChecked;
    
    setUserUnidades(prev => prev.map((u: any) => filteredIds.includes(u.unidad_negocio) ? { ...u, [field]: newValue } : u));
  };

  const saveUnidades = async () => {
    setSavingUn(true); setModalMsg({ text: '', type: '' });
    try {
      const active = userUnidades.filter((u: any) => u.acceso);
      await apiFetch(`/api/usuarios/${modalUser.id}/unidades`, token, { method: 'PUT', body: JSON.stringify(active) });
      setModalMsg({ text: '✅ Sucursales asignadas correctamente', type: 'success' });
      load(); // Refrescar la tabla para actualizar el contador "X asignadas"
      setTimeout(() => setModalUser(null), 1500);
    } catch (e: any) { setModalMsg({ text: '❌ Error: ' + e.message, type: 'error' }); }
    setSavingUn(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><Settings size={28} /></div>
          <div><h2 className="text-2xl font-bold text-slate-800">Configuración</h2><p className="text-sm text-slate-500">Gestión de usuarios y auditoría</p></div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
          <button onClick={() => setConfigTab('usuarios')} className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors ${configTab === 'usuarios' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>Usuarios</button>
          <button onClick={() => setConfigTab('audit')} className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors ${configTab === 'audit' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>Auditoría</button>
          <button onClick={() => setConfigTab('ingresos')} className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors ${configTab === 'ingresos' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>Conf. Ingresos</button>
          <button onClick={() => setConfigTab('gastos-asientos')} className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors ${configTab === 'gastos-asientos' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>Conf. Gastos Asientos</button>
          <button onClick={() => setConfigTab('gastos-compras')} className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors ${configTab === 'gastos-compras' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>Conf. Gastos Compras</button>
          <button onClick={() => setConfigTab('centros-costo')} className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors ${configTab === 'centros-costo' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>Conf. Centros de Costo</button>
          <button onClick={() => setConfigTab('ajustes-excel')} className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors ${configTab === 'ajustes-excel' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>Ajustes Excel</button>
        </div>
      </div>

      {configTab === 'usuarios' ? (
        <>
          {/* Formulario */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Users size={18} /> {editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nombre *</label>
            <input className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email *</label>
            <input type="email" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Contraseña {editing ? '(vacía = mantener)' : '*'}</label>
            <input type="password" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" placeholder={editing ? '•••••' : ''} value={form.password || ''} onChange={e => setForm({...form, password: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Perfil</label>
            <select className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 cursor-pointer" value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}>
              <option value="admin">Administrador</option><option value="responsable_un">Responsable U.N.</option><option value="consulta">Solo Consulta</option>
            </select></div>
          <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Chat ID Telegram</label>
            <input className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" placeholder="Ej: 123456789" value={form.telegram_chat_id || ''} onChange={e => setForm({...form, telegram_chat_id: e.target.value})} />
            <p className="text-[10px] text-slate-400 mt-1">ID numérico obtenido del Bot</p></div>
        </div>
        {errorMsg && <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"><span className="text-xl">⚠️</span> {errorMsg}</div>}
        <div className="flex gap-2 mt-4 items-center">
          <button onClick={saveUser} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"><Save size={14} /> Guardar</button>
          {editing && <button onClick={resetForm} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"><X size={14} /> Cancelar</button>}
          {saveMsg && <span className="text-emerald-600 text-sm font-medium ml-2 flex items-center gap-1"><Check size={16} /> {saveMsg}</span>}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? <div className="flex justify-center p-8"><Loader2 size={24} className="animate-spin text-blue-600" /></div> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200"><tr>
              <th className="text-left px-5 py-3 font-bold text-slate-600 uppercase text-xs tracking-wider">Nombre</th>
              <th className="text-left px-5 py-3 font-bold text-slate-600 uppercase text-xs tracking-wider">Email</th>
              <th className="text-left px-5 py-3 font-bold text-slate-600 uppercase text-xs tracking-wider">Perfil</th>
              <th className="text-left px-5 py-3 font-bold text-slate-600 uppercase text-xs tracking-wider">Sucursales</th>
              <th className="text-left px-5 py-3 font-bold text-slate-600 uppercase text-xs tracking-wider">Telegram</th>
              <th className="text-left px-5 py-3 font-bold text-slate-600 uppercase text-xs tracking-wider">Estado</th>
              <th className="px-5 py-3"></th>
            </tr></thead>
            <tbody>
              {usuarios.map((u: any) => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-slate-800">{u.nombre}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{u.email}</td>
                  <td className="px-5 py-3"><span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100">{ROLES_MAP[u.rol] || u.rol}</span></td>
                  <td className="px-5 py-3">
                    <button 
                      onClick={() => openUnidades(u)}
                      title="Gestionar Sucursales"
                      className={`text-xs font-bold px-3 py-1.5 rounded-md border transition-colors hover:shadow-sm ${u.sucursales_asignadas > 0 ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}
                    >
                      {u.sucursales_asignadas > 0 ? `${u.sucursales_asignadas} asignadas` : 'Asignar Sucursal'}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500 font-mono">{u.telegram_chat_id || '—'}</td>
                  <td className="px-5 py-3"><span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${u.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      {u.telegram_chat_id && <button onClick={() => testTelegram(u.id)} className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors" title="Test Telegram"><Send size={15} /></button>}
                      <button onClick={() => { setForm({...u, password: ''}); setEditing(true); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Editar"><Edit2 size={15} /></button>
                      <button onClick={() => deleteUser(u.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title="Eliminar"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">No hay usuarios registrados</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      </>) : configTab === 'audit' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Shield size={18} className="text-slate-500" /> Registro de Actividad</h3>
            <button onClick={loadAudit} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Actualizar</button>
          </div>
          {auditLoading ? <div className="flex justify-center p-8"><Loader2 size={24} className="animate-spin text-blue-600" /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200"><tr>
                  <th className="text-left px-5 py-3 font-bold text-slate-600 uppercase text-xs tracking-wider">Fecha / Hora</th>
                  <th className="text-left px-5 py-3 font-bold text-slate-600 uppercase text-xs tracking-wider">Usuario</th>
                  <th className="text-left px-5 py-3 font-bold text-slate-600 uppercase text-xs tracking-wider">Acción</th>
                  <th className="text-left px-5 py-3 font-bold text-slate-600 uppercase text-xs tracking-wider">Detalles</th>
                </tr></thead>
                <tbody>
                  {auditLogs.map((log: any) => (
                    <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{new Date(log.fecha).toLocaleString('es-AR')}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{log.usuario_email}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">{log.accion}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs">{log.detalles}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">No hay registros de auditoría</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : configTab === 'centros-costo' ? (
        <ConfiguracionCentrosCosto token={token} />
      ) : (
        <ConfiguracionAvanzada token={token} tipo={configTab as any} />
      )}

      {/* Modal Unidades de Negocio */}
      {modalUser && (() => {
        const filteredUnidades = userUnidades
          .filter((u: any) => (u.display_name || u.unidad_negocio).toLowerCase().includes(searchUnidad.toLowerCase()))
          .sort((a: any, b: any) => Number(b.acceso) - Number(a.acceso));
        const filteredIds = filteredUnidades.map((u: any) => u.unidad_negocio);

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div><h3 className="font-bold text-slate-800 text-lg">Sucursales Asignadas</h3><p className="text-sm text-slate-500">{modalUser.nombre}</p></div>
                <button onClick={() => { setModalUser(null); setSearchUnidad(''); }} className="text-slate-400 hover:bg-slate-100 p-2 rounded-lg"><X size={20} /></button>
              </div>
              
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar sucursal..." 
                    value={searchUnidad}
                    onChange={(e) => setSearchUnidad(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="p-5 overflow-y-auto flex-1 bg-slate-50">
                {modalLoading ? <div className="flex justify-center p-8"><Loader2 size={24} className="animate-spin text-blue-600" /></div> : (
                  <table className="w-full text-sm bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <thead className="bg-slate-50 border-b border-slate-200"><tr>
                      <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase">Sucursal</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-600 text-xs uppercase">
                        <label className="flex items-center justify-center gap-1.5 cursor-pointer hover:text-blue-600 transition-colors" title="Seleccionar/Deseleccionar todos">
                          <span>Acceso</span>
                          {filteredUnidades.length > 0 && (
                            <input 
                              type="checkbox" 
                              className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer mt-0.5" 
                              checked={filteredUnidades.every((u: any) => u.acceso)}
                              onChange={() => toggleAll('acceso', filteredIds)}
                            />
                          )}
                        </label>
                      </th>
                    </tr></thead>
                    <tbody>
                      {filteredUnidades.map((u: any) => (
                        <tr key={u.unidad_negocio} className={`border-b border-slate-100 transition-colors hover:bg-slate-50/50`}>
                          <td className="px-4 py-3 font-medium text-slate-700">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] uppercase font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 tracking-wider">Sucursal</span>
                                <span className={'text-slate-800'}>{u.display_name || u.unidad_negocio}</span>
                              </div>
                              {u.empresa_padre && (
                                <span className="text-[10px] text-slate-400 font-normal ml-10 flex items-center gap-1">
                                  <Building2 size={10} /> {u.empresa_padre}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-center"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded cursor-pointer" checked={u.acceso} onChange={() => toggleUn(u.unidad_negocio, 'acceso')} /></td>
                        </tr>
                      ))}
                      {filteredUnidades.length === 0 && <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-400">No hay unidades disponibles para esa búsqueda</td></tr>}
                    </tbody>
                  </table>
                )}
              </div>
              {modalMsg.text && (
                <div className={`px-5 py-3 border-t text-sm font-medium flex items-center gap-2 ${modalMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                  {modalMsg.type === 'success' ? <Check size={16} /> : <span className="text-xl leading-none">⚠️</span>} {modalMsg.text}
                </div>
              )}
              <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white rounded-b-2xl">
                <button onClick={() => { setModalUser(null); setSearchUnidad(''); }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold px-5 py-2.5 rounded-lg transition-colors">Cancelar</button>
                <button onClick={saveUnidades} disabled={savingUn} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2">
                  {savingUn ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// NEW EMPTY TABS (Dashboard & Gastos)
// ═══════════════════════════════════════════════════════
function MainDashboard({ token }: { token: string }) {
  return (
    <div className="bg-slate-50 min-h-[80vh]">
      <InformeGestion token={token} />
    </div>
  );
}

function Gastos({ token }: { token: string }) {
  return (
    <div className="bg-slate-50 min-h-[80vh]">
      <InformeGestion token={token} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// APP WRAPPER — Login + Navigation
// ═══════════════════════════════════════════════════════
export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('cert_token'));
  const [user, setUser] = useState<any>(() => {
    try { return JSON.parse(localStorage.getItem('cert_user') || 'null'); } catch { return null; }
  });
  const [view, setView] = useState<'dashboard' | 'ingresos' | 'gastos' | 'config'>('ingresos');

  const handleLogin = (t: string, u: any) => {
    setToken(t); setUser(u);
    localStorage.setItem('cert_token', t);
    localStorage.setItem('cert_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setToken(null); setUser(null);
    localStorage.removeItem('cert_token');
    localStorage.removeItem('cert_user');
  };

  if (!token) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Top Nav */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <h1 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <img src="/logo_cee.png" alt="CEE" className="h-8 w-8 rounded-md object-contain" />
              Reporte de Resultados
            </h1>
            <nav className="flex gap-1">
              <button onClick={() => setView('dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}>
                <span className="flex items-center gap-1.5"><LayoutDashboard size={15} /> Dashboard</span>
              </button>
              <button onClick={() => setView('ingresos')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'ingresos' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}>
                <span className="flex items-center gap-1.5"><TrendingUp size={15} /> Ingresos</span>
              </button>
              <button onClick={() => setView('gastos')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'gastos' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}>
                <span className="flex items-center gap-1.5"><Wallet size={15} /> Gastos</span>
              </button>
              {user?.rol === 'admin' && (
                <button onClick={() => setView('config')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'config' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}>
                  <span className="flex items-center gap-1.5"><Settings size={15} /> Configuración</span>
                </button>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500">{user?.nombre} <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md ml-1">{ROLES_MAP[user?.rol] || user?.rol}</span></span>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Cerrar Sesión"><LogOut size={16} /></button>
          </div>
        </div>
      </div>

      {/* Content */}
      {view === 'dashboard' && <MainDashboard token={token} />}
      {view === 'ingresos' && <Dashboard token={token} onLogout={handleLogout} />}
      {view === 'gastos' && <Gastos token={token} />}
      {view === 'config' && user?.rol === 'admin' && <Configuracion token={token} />}
    </div>
  );
}
