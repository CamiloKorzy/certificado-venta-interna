import React, { useState, useEffect, useMemo, useRef } from 'react'
import { apiFetch } from '../App';

export async function fetchPeriodos(token: string) {
  return await apiFetch('/api/ventas/periodos', token);
}
export async function fetchEmpresas(token: string) {
  return await apiFetch('/api/ventas/empresas', token);
}
export async function fetchClientes(token: string, empresas: string[]) {
  const q = empresas.length > 0 ? `?empresas=${empresas.join(',')}` : '';
  return await apiFetch(`/api/ventas/clientes${q}`, token);
}
export async function fetchProductos(token: string, empresas: string[], clientes: string[]) {
  const params = new URLSearchParams()
  if (empresas.length > 0) params.append('empresas', empresas.join(','))
  if (clientes.length > 0) params.append('clientes', clientes.join(','))
  const q = params.toString() ? `?${params.toString()}` : ''
  return await apiFetch(`/api/ventas/productos${q}`, token);
}
export async function fetchResumen(token: string, periodos: string[], empresas: string[], clientes: string[], productos: string[], fecha_desde?: string, fecha_hasta?: string) {
  const params = new URLSearchParams()
  if (periodos.length > 0) params.append('periodos', periodos.join(','))
  if (empresas.length > 0) params.append('empresas', empresas.join(','))
  if (clientes.length > 0) params.append('clientes', clientes.join(','))
  if (productos && productos.length > 0) params.append('productos', productos.join(','))
  if (fecha_desde) params.append('fecha_desde', fecha_desde)
  if (fecha_hasta) params.append('fecha_hasta', fecha_hasta)
  const q = params.toString() ? `?${params.toString()}` : ''
  return await apiFetch(`/api/ventas/resumen${q}`, token);
}
export async function fetchFacturacionStats(token: string, periodos: string[], empresas: string[], clientes: string[], productos: string[], fecha_desde?: string, fecha_hasta?: string) {
  const params = new URLSearchParams()
  if (periodos.length > 0) params.append('periodos', periodos.join(','))
  if (empresas.length > 0) params.append('empresas', empresas.join(','))
  if (clientes.length > 0) params.append('clientes', clientes.join(','))
  if (productos && productos.length > 0) params.append('productos', productos.join(','))
  if (fecha_desde) params.append('fecha_desde', fecha_desde)
  if (fecha_hasta) params.append('fecha_hasta', fecha_hasta)
  const q = params.toString() ? `?${params.toString()}` : ''
  return await apiFetch(`/api/ventas/facturacion_stats${q}`, token);
}
export async function fetchTracking(token: string, periodos: string[], empresas: string[], clientes: string[], productos: string[], fecha_desde?: string, fecha_hasta?: string) {
  const params = new URLSearchParams()
  if (periodos.length > 0) params.append('periodos', periodos.join(','))
  if (empresas.length > 0) params.append('empresas', empresas.join(','))
  if (clientes.length > 0) params.append('clientes', clientes.join(','))
  if (productos && productos.length > 0) params.append('productos', productos.join(','))
  if (fecha_desde) params.append('fecha_desde', fecha_desde)
  if (fecha_hasta) params.append('fecha_hasta', fecha_hasta)
  const q = params.toString() ? `?${params.toString()}` : ''
  return await apiFetch(`/api/ventas/tracking${q}`, token);
}
import { 
  LayoutDashboard, TrendingUp, AlertCircle, FileText, CheckCircle, 
  Download, Search, ChevronDown, ChevronRight, Check, ArrowUpDown, Tag, DollarSign, BarChart3
} from 'lucide-react'
import * as XLSX from 'xlsx'

// Custom Checkbox Dropdown copiado exactamente del formato profesional (KPIs Compras)
function CheckboxSelect({ options, selected, onChange, label }: any) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClick = (e: any) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredOptions = options.filter((o: any) => o.label.toLowerCase().includes(searchTerm.toLowerCase()));

  const toggleAll = () => {
    if (selected.length === options.length) onChange([]);
    else onChange(options.map((o: any) => o.value));
  };
  
  const toggleOne = (val: string) => {
    if (selected.includes(val)) onChange(selected.filter((v: string) => v !== val));
    else onChange([...selected, val]);
  };

  const getDisplayText = () => {
    if (selected.length === 0) return 'Ninguna (Limpiado)';
    if (options.length > 0 && selected.length === options.length) return 'Todas seleccionadas';
    
    if (selected.length <= 2) {
      return options.filter((o: any) => selected.includes(o.value)).map((o: any) => o.label).join(', ');
    }
    
    const firstSelected = options.find((o: any) => selected.includes(o.value))?.label;
    return `${firstSelected} (+${selected.length - 1})`;
  };

  const displayText = getDisplayText();

  return (
    <div className="relative w-full" ref={ref}>
      <div 
        onClick={() => setOpen(!open)}
        className="px-3 py-[7px] bg-white border border-slate-300 rounded text-sm text-slate-700 cursor-pointer flex justify-between items-center bg-white hover:bg-slate-50 transition-colors shadow-sm"
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </div>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-72 overflow-y-auto p-2 flex flex-col">
          <div className="sticky top-0 bg-white z-10 pb-2 mb-2 border-b border-slate-100">
            <input 
              type="text" 
              placeholder={`Buscar ${label.toLowerCase()}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center justify-between p-2 hover:bg-slate-50 border-b border-slate-100 mb-1">
            <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={toggleAll}>
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected.length === options.length ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                {selected.length === options.length && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm font-bold text-slate-700">Seleccionar Todas</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onChange([]); }} 
              className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded bg-red-50/50"
            >
              Borrar Todo
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredOptions.length === 0 && <div className="text-xs text-slate-400 p-2 text-center">No hay resultados</div>}
            {filteredOptions.map((o: any) => (
              <div key={o.value} className="flex items-center gap-2 p-2 hover:bg-slate-50 cursor-pointer" onClick={() => toggleOne(o.value)}>
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected.includes(o.value) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                  {selected.includes(o.value) && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-slate-700 truncate">{o.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VentasTerceros({ token, defaultUnidad, defaultPeriodo }: { token: string, defaultUnidad?: string, defaultPeriodo?: string }) {
  const [optsPeriodos, setOptsPeriodos] = useState<{label: string, value: string}[]>([])
  const [optsEmpresas, setOptsEmpresas] = useState<{label: string, value: string}[]>([])
  const [optsClientes, setOptsClientes] = useState<{label: string, value: string}[]>([])
  const [optsProductos, setOptsProductos] = useState<{label: string, value: string}[]>([])
  
  const [selPeriodos, setSelPeriodos] = useState<string[]>([])
  const [selEmpresas, setSelEmpresas] = useState<string[]>([])
  const [selClientes, setSelClientes] = useState<string[]>([])
  const [selProductos, setSelProductos] = useState<string[]>([])
  const [fechaDesde, setFechaDesde] = useState<string>('')
  const [fechaHasta, setFechaHasta] = useState<string>('')

  const [activeTab, setActiveTab] = useState<'operativo' | 'facturacion'>('operativo')
  const [resumen, setResumen] = useState<any>(null)
  const [tracking, setTracking] = useState<any[]>([])
  const [facturacionStats, setFacturacionStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [search, setSearch] = useState('');
  const [modalType, setModalType] = useState<'remitos' | 'facturas' | 'emitidas' | 'despachados' | 'remitos_facturados' | 'facturas_cobradas' | 'ranking_clientes' | 'ranking_empresas' | 'prod_cliente' | null>(null);
  const [expandedFactura, setExpandedFactura] = useState<string | null>(null);
  const [modalSearch, setModalSearch] = useState('');
  const [modalTitleContext, setModalTitleContext] = useState<string | null>(null);

  // Sorting and Pagination
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'} | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    fetchPeriodos(token).then(data => {
      if (Array.isArray(data)) {
        const mapped = data.map(p => ({ label: p.label, value: p.periodo }));
        setOptsPeriodos(mapped)
        setSelPeriodos(defaultPeriodo && mapped.some(m => m.value === defaultPeriodo) ? [defaultPeriodo] : mapped.map(m => m.value))
      } else {
        if (data && data.detail) setErrorMsg(prev => prev ? prev + ' | ' + data.detail : data.detail)
      }
    }).catch(err => {
      setErrorMsg("Error de red cargando períodos: " + err.message)
    })
    
    fetchEmpresas(token).then(data => {
      if (Array.isArray(data)) {
        const mapped = data.map(e => ({ label: e, value: e }));
        setOptsEmpresas(mapped)
        setSelEmpresas(defaultUnidad && mapped.some(m => m.value === defaultUnidad) ? [defaultUnidad] : mapped.map(m => m.value))
      } else {
        if (data && data.detail) setErrorMsg(prev => prev ? prev + ' | ' + data.detail : data.detail)
      }
    }).catch(err => {
      setErrorMsg("Error de red cargando empresas: " + err.message)
    })
  }, [])

  useEffect(() => {
    fetchClientes(token, selEmpresas).then(data => {
      if (Array.isArray(data)) {
        const mapped = data.map(c => ({ label: c, value: c }));
        setOptsClientes(mapped);
      }
    }).catch(err => console.error(err))
    
    fetchProductos(token, selEmpresas, selClientes).then(data => {
      if (Array.isArray(data)) {
        const mapped = data.map(p => ({ label: p, value: p }));
        setOptsProductos(mapped);
      }
    }).catch(err => console.error(err))
  }, [selEmpresas, selClientes])

  const loadData = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const activeStatsPromise = activeTab === 'facturacion' 
        ? fetchFacturacionStats(token, selPeriodos, selEmpresas, selClientes, selProductos, fechaDesde, fechaHasta)
        : Promise.resolve(null);

      const [res, trk, stats] = await Promise.all([
        fetchResumen(token, selPeriodos, selEmpresas, selClientes, selProductos, fechaDesde, fechaHasta),
        fetchTracking(token, selPeriodos, selEmpresas, selClientes, selProductos, fechaDesde, fechaHasta),
        activeStatsPromise
      ]);

      if (res && res.detail) {
        setErrorMsg(res.detail)
        return
      }
      setResumen(res)
      
      if (Array.isArray(trk)) {
        setTracking(trk)
      } else {
        setErrorMsg(trk?.detail || "Error al obtener la grilla detallada.")
      }
      
      if (stats) setFacturacionStats(stats);
      setCurrentPage(1)
    } catch (e: any) {
      setErrorMsg("Error de conexión con el servidor: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  // Reload stats if jumping into facturacion tab and they are missing
  useEffect(() => {
    if (activeTab === 'facturacion' && !facturacionStats && resumen && !loading) {
      loadData();
    }
  }, [activeTab]);

  const exportExcel = () => {
    if (tracking.length === 0) return
    const ws = XLSX.utils.json_to_sheet(tracking)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Tracking_Ventas")
    XLSX.writeFile(wb, "Tracking_Ventas.xlsx")
  }

  const getModalRows = () => {
    if (!modalType) return [];
    
    // FIRST PASS: Aggregate rows to prevent duplicate / conflicting cartesian rows from Finnegans
    const map = new Map();
    for (const t of tracking) {
      if (!t) continue;
      
      if (modalType === 'remitos' || modalType === 'despachados' || modalType === 'remitos_facturados' || modalType === 'prod_cliente') {
        const key = `${t.empresa}|${t.cliente}|${t.remitonumero || t.facturanumero}|${t.producto}`;
        if (!map.has(key)) {
          map.set(key, { ...t });
        } else {
          const ext = map.get(key);
          ext.cantidaddespachada = (parseFloat(ext.cantidaddespachada || '0') + parseFloat(t.cantidaddespachada || '0')).toString();
          ext.cantidadpendientefacturar = (parseFloat(ext.cantidadpendientefacturar || '0') + parseFloat(t.cantidadpendientefacturar || '0')).toString();
        }
      } else if (modalType === 'facturas' || modalType === 'emitidas' || modalType === 'facturas_cobradas' || modalType === 'ranking_clientes') {
        const key = `${t.empresa}|${t.cliente}|${t.facturanumero}`;
        const impFac = !isInvalidNum(t.facturaimporte) ? parseFloat(t.facturaimporte) : 0;
        const impCob = !isInvalidNum(t.importeaplicado) ? parseFloat(t.importeaplicado) : 0;
        
        if (!map.has(key)) {
          map.set(key, { 
             ...t,
             _remitosSet: new Set(),
             _remitosList: [],
             _productosSet: new Set(),
             _impFac: impFac,
             _maxImpCob: impCob,
             _isProcesoCompleto: t.estadoproceso === 'PROCESO COMPLETO',
             _cobranzasSet: new Set()
          });
        } else {
          const ext = map.get(key);
          ext._maxImpCob = Math.max(ext._maxImpCob, impCob);
          if (t.estadoproceso === 'PROCESO COMPLETO') ext._isProcesoCompleto = true;
          if (t.cobranzanumero) ext._cobranzasSet.add(t.cobranzanumero);
        }
        
        const agg = map.get(key);
        if (t.cobranzanumero) agg._cobranzasSet.add(t.cobranzanumero);
        
        if (t.remitonumero) {
            const rKey = `${t.remitonumero}|${t.producto}`;
            if (!agg._remitosSet.has(rKey)) {
                agg._remitosSet.add(rKey);
                agg._remitosList.push({ remitonumero: t.remitonumero, producto: t.producto });
            }
        }
        if (t.producto) agg._productosSet.add(t.producto);
      }
    }
    
    let rows = Array.from(map.values());

    // SECOND PASS: Filter logically based on the aggregated state
    rows = rows.filter((t: any) => {
      if (modalType === 'remitos') return (parseFloat(t.cantidadpendientefacturar) > 0 || !t.facturaid);
      if (modalType === 'despachados') return !!t.remitonumero;
      if (modalType === 'remitos_facturados') return !!t.remitonumero && parseFloat(t.cantidadpendientefacturar || '0') <= 0;
      if (modalType === 'prod_cliente') return (!!t.remitonumero || !!t.facturanumero) && t.cliente === modalTitleContext?.split('|')[0] && t.producto === modalTitleContext?.split('|')[1];
      
      // Facturas/Ranking aggregates
      if (!t.facturanumero) return false;
      
      t._restante = Math.max(0, t._impFac - t._maxImpCob);
      if (t._isProcesoCompleto && t._maxImpCob === 0) {
        t._restante = 0; // Fix anomaly if PROCESO COMPLETO but receipt amount didn't join properly
      }
      
      t.producto = t._productosSet?.size > 0 ? Array.from(t._productosSet).join(', ') : null;
      t._cobranzasList = t._cobranzasSet?.size > 0 ? Array.from(t._cobranzasSet) : [];

      if (modalType === 'emitidas') return true;
      if (modalType === 'ranking_clientes') return t.cliente === modalTitleContext;
      if (modalType === 'facturas_cobradas') return t._isProcesoCompleto || t._maxImpCob > 0;
      if (modalType === 'facturas') return !t._isProcesoCompleto && t._restante > 0;

      return false;
    });

    return rows;
  };

  const getFilteredModalRows = () => {
    let rows = getModalRows();
    if (modalSearch.trim() !== '') {
      const term = modalSearch.toLowerCase();
      rows = rows.filter((t: any) => 
        (t.empresa && t.empresa.toLowerCase().includes(term)) ||
        (t.cliente && t.cliente.toLowerCase().includes(term)) ||
        (t.remitonumero && t.remitonumero.toLowerCase().includes(term)) ||
        (t.facturanumero && t.facturanumero.toLowerCase().includes(term)) ||
        (t.producto && t.producto.toLowerCase().includes(term))
      );
    }
    return rows;
  };

  const closeModal = () => {
    setModalType(null);
    setExpandedFactura(null);
    setModalSearch('');
  };

  const exportModalExcel = () => {
    if (!modalType) return;
    const rows = getFilteredModalRows();
    let modalData: any[] = [];
    
    if (modalType === 'emitidas') {
       rows.forEach((agg: any) => {
          if (agg._remitosList && agg._remitosList.length > 0) {
             agg._remitosList.forEach((r: any, idx: number) => {
                 modalData.push({
                    Empresa: agg.empresa,
                    Cliente: agg.cliente,
                    'Factura Nº': agg.facturanumero,
                    'Remito Vinculado': r.remitonumero,
                    Producto: r.producto || '-',
                    'Imp. Facturado': idx === 0 ? agg._impFac : null
                 });
             });
          } else {
             modalData.push({
                 Empresa: agg.empresa,
                 Cliente: agg.cliente,
                 'Factura Nº': agg.facturanumero,
                 'Remito Vinculado': 'SIN REMITO',
                 Producto: agg.producto || '-',
                 'Imp. Facturado': agg._impFac
             });
          }
       });
    } else {
       modalData = rows.map((t: any) => {
          return {
            Empresa: t.empresa,
            Cliente: t.cliente,
            ...(modalType === 'remitos' || modalType === 'despachados' || modalType === 'remitos_facturados' ? { 'Remito Nº': t.remitonumero } : { 'Factura Nº': t.facturanumero }),
            ...(modalType === 'remitos_facturados' && t.facturanumero ? { 'Factura Vinculada': t.facturanumero } : {}),
            ...(modalType === 'facturas_cobradas' && (t._cobranzasList || t.cobranzanumero) ? { 'Recibo Vinculado': t._cobranzasList ? t._cobranzasList.join(', ') : t.cobranzanumero } : {}),
            Producto: t.producto || '-',
            ...(modalType === 'remitos' ? { 'Cant. Original': t.cantidaddespachada, 'Cant. Pendiente': t.cantidadpendientefacturar } : modalType === 'despachados' || modalType === 'remitos_facturados' ? { 'Cant. Despachada': t.cantidaddespachada } : modalType === 'facturas' ? { 'Imp. Original': t._impFac, 'Monto Restante': t._restante } : modalType === 'facturas_cobradas' ? { 'Imp. Facturado': t._impFac, 'Imp. Cobrado': t._impFac - t._restante } : { 'Imp. Facturado': t._impFac })
          };
       });
    }

    const ws = XLSX.utils.json_to_sheet(modalData)
    const wb = XLSX.utils.book_new()
    const sheets: any = { remitos: "Remitos_Pte", facturas: "Facturas_Pte", emitidas: "Fact_Emitidas", despachados: "Remitos_Desp", remitos_facturados: "Remitos_Fact", facturas_cobradas: "Facturas_Cobradas" };
    const files: any = { remitos: "Remitos_Pendientes.xlsx", facturas: "Facturas_Pendientes.xlsx", emitidas: "Facturas_Emitidas.xlsx", despachados: "Remitos_Despachados.xlsx", remitos_facturados: "Remitos_Facturados.xlsx", facturas_cobradas: "Facturas_Cobradas.xlsx" };
    
    XLSX.utils.book_append_sheet(wb, ws, sheets[modalType]);
    XLSX.writeFile(wb, files[modalType]);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(num || 0)
  }

  const isInvalidNum = (val: any) => {
    if (val === null || val === undefined) return true;
    const str = String(val).trim().toUpperCase();
    if (str === '' || str === 'NAN' || str === 'NULL' || str === 'NONE') return true;
    if (isNaN(parseFloat(str))) return true;
    return false;
  }

  const handleSort = (key: string) => {
    let direction: 'asc'|'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const filteredTracking = useMemo(() => {
    return tracking.filter(t => {
      if (!search) return true;
      const term = search.toLowerCase();
      return (
        t.remitonumero?.toLowerCase().includes(term) ||
        t.cliente?.toLowerCase().includes(term) ||
        t.facturanumero?.toLowerCase().includes(term) ||
        t.producto?.toLowerCase().includes(term) ||
        t.empresa?.toLowerCase().includes(term)
      );
    });
  }, [tracking, search]);

  const sortedTracking = useMemo(() => {
    let sortable = [...filteredTracking];
    if (sortConfig !== null) {
      sortable.sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [filteredTracking, sortConfig]);

  const totalPages = Math.ceil(sortedTracking.length / itemsPerPage) || 1;
  const paginatedTracking = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedTracking.slice(start, start + itemsPerPage);
  }, [sortedTracking, currentPage]);

  return (
    <div className="flex w-full h-full min-h-screen bg-[#f4f6f8] text-slate-800 font-sans flex-col relative overflow-hidden">
      
      {/* SIDEBAR NO UTILIZADO - Cabecera Superior Integrada */}
      <div className="px-6 py-4 bg-[#0a192f] text-white flex items-center justify-between shadow-md z-40 relative">
        <div>
          <h1 className="text-xl font-bold tracking-wider mb-1 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-blue-400" /> Tracking de Ventas
          </h1>
          <p className="text-xs text-slate-400">Control de Remitos, Facturas y Cobranzas</p>
        </div>
      </div>

      {/* ERROR ALERT */}
      {errorMsg && (
        <div className="bg-red-100 text-red-700 px-6 py-3 font-bold border-b border-red-200 text-sm">
          ⚠️ Error: {errorMsg}
        </div>
      )}

      {/* TOP NAVBAR (FILTERS) */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shadow-sm z-30 shrink-0 relative">
        <div className="flex flex-wrap items-center gap-6 w-full xl:w-auto">
        
          {/* SUCURSAL FILTER */}
          <div className="flex flex-col gap-1 w-56">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Empresas</span>
            <CheckboxSelect 
              options={optsEmpresas}
              selected={selEmpresas}
              onChange={(vals: any[]) => setSelEmpresas(vals)}
              label="Empresas"
            />
          </div>

          {/* PERIODO FILTER */}
          <div className="flex flex-col gap-1 w-56">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Períodos</span>
            <CheckboxSelect 
              options={optsPeriodos}
              selected={selPeriodos}
              onChange={(vals: any[]) => setSelPeriodos(vals)}
              label="Períodos"
            />
          </div>

          {/* CLIENTE FILTER */}
          <div className="flex flex-col gap-1 w-56">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Clientes</span>
            <CheckboxSelect 
              options={optsClientes}
              selected={selClientes}
              onChange={(vals: any[]) => setSelClientes(vals)}
              label="Clientes"
            />
          </div>

          {/* PRODUCTO FILTER */}
          <div className="flex flex-col gap-1 w-56">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Productos</span>
            <CheckboxSelect 
              options={optsProductos}
              selected={selProductos}
              onChange={(vals: any[]) => setSelProductos(vals)}
              label="Productos"
            />
          </div>

        </div>
        
        {/* DATE FILTERS */}
        <div className="flex flex-col gap-1 w-72">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Rango de Fechas (Remito)</span>
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              className="w-full px-2 py-[7px] bg-white border border-slate-300 rounded text-sm text-slate-700 hover:bg-slate-50 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            <span className="text-slate-400 font-bold">-</span>
            <input 
              type="date"
              value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              className="w-full px-2 py-[7px] bg-white border border-slate-300 rounded text-sm text-slate-700 hover:bg-slate-50 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>
        
        <button 
          onClick={loadData} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-[9px] rounded text-sm font-semibold shadow-sm transition-colors shrink-0 disabled:opacity-50"
        >
          {loading ? 'Analizando...' : 'ANALIZAR DATOS'}
        </button>
      </header>

      {/* TABS NAVIGATION */}
      <div className="bg-white border-b border-slate-200 px-6 flex gap-6 z-20 relative shadow-sm">
        <button 
          onClick={() => setActiveTab('operativo')}
          className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'operativo' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Tracking Operativo
        </button>
        <button 
          onClick={() => setActiveTab('facturacion')}
          className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'facturacion' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <BarChart3 className="w-4 h-4" />
          Facturación y Rankings
        </button>
      </div>

      {/* DASHBOARD BODY */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : resumen && activeTab === 'operativo' ? (
          <>
            {/* TOP KPI ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
              
              {(() => {
                const totalRemitos = resumen.cant_remitos || 0;
                const ptesFacturar = resumen.cant_remitos_pte_fact || 0;
                const remitosFacturados = totalRemitos - ptesFacturar;
                const pctPteFacturar = totalRemitos > 0 ? ((ptesFacturar / totalRemitos) * 100).toFixed(1) : '0';
                const pctFacturados = totalRemitos > 0 ? ((remitosFacturados / totalRemitos) * 100).toFixed(1) : '0';
              
                const totalFacturas = resumen.cant_facturas || 0;
                const ptesCobro = resumen.cant_facturas_pte_cobro || 0;
                const facturasCobradas = totalFacturas - ptesCobro;
                const pctPteCobro = totalFacturas > 0 ? ((ptesCobro / totalFacturas) * 100).toFixed(1) : '0';
                const pctCobradas = totalFacturas > 0 ? ((facturasCobradas / totalFacturas) * 100).toFixed(1) : '0';

                return (
                  <>
                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm relative overflow-hidden group">
                    <div className="w-1 h-full bg-blue-500 absolute left-0 top-0"></div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remitos Despachados</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{totalRemitos.toLocaleString()}</h3>
                      </div>
                      <TrendingUp className="w-5 h-5 text-blue-300" />
                    </div>
                    <div className="mt-3 border-t border-slate-100 pt-2 flex items-center justify-between">
                      <button onClick={() => setModalType('despachados')} className="text-[11px] font-bold text-slate-500 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer">
                         Ver detalle... <ChevronRight className="w-3 h-3"/>
                      </button>
                      <p className="text-[11px] text-slate-400 text-right">Cant. Comprobantes</p>
                    </div>
                  </div>

                  <div className="bg-white border border-amber-200 bg-amber-50/20 rounded-lg p-5 shadow-sm relative overflow-hidden group">
                    <div className="w-1 h-full bg-amber-400 absolute left-0 top-0"></div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Remitos Pte. Facturar</p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <h3 className="text-2xl font-black text-slate-800">{ptesFacturar.toLocaleString()}</h3>
                          <span className="text-sm font-bold text-amber-500">({pctPteFacturar}%)</span>
                        </div>
                      </div>
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="mt-3 border-t border-amber-100 pt-2 flex items-center justify-between">
                      <button onClick={() => setModalType('remitos')} className="text-[11px] font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 transition-colors cursor-pointer">
                         Ver detalle... <ChevronRight className="w-3 h-3"/>
                      </button>
                      <p className="text-[11px] text-amber-600/80 text-right cursor-help" title="Cantidad de Remitos (Cabeceras) que aguardan facturación">Cant. Comprobantes</p>
                    </div>
                  </div>

                  <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-lg p-5 shadow-sm relative overflow-hidden group">
                    <div className="w-1 h-full bg-emerald-500 absolute left-0 top-0"></div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Remitos Facturados</p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <h3 className="text-2xl font-black text-slate-800">{remitosFacturados.toLocaleString()}</h3>
                          <span className="text-sm font-bold text-emerald-500">({pctFacturados}%)</span>
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="mt-3 border-t border-emerald-100 pt-2 flex items-center justify-between">
                      <button onClick={() => setModalType('remitos_facturados')} className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 transition-colors cursor-pointer">
                         Ver detalle... <ChevronRight className="w-3 h-3"/>
                      </button>
                      <p className="text-[11px] text-emerald-400/80 text-right">Cant. Comprobantes</p>
                    </div>
                  </div>
    
                  <div className="bg-white border border-purple-200 bg-purple-50/30 rounded-lg p-5 shadow-sm relative overflow-hidden group">
                    <div className="w-1 h-full bg-purple-500 absolute left-0 top-0"></div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Facturas Emitidas</p>
                        <div className="flex items-baseline gap-2 mt-1">
                           <h3 className="text-2xl font-black text-slate-800">{totalFacturas.toLocaleString()}</h3>
                           <span className="text-sm font-bold text-purple-500">Comprobantes</span>
                        </div>
                      </div>
                      <FileText className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="mt-3 border-t border-purple-100 pt-2 flex items-center justify-between">
                      <button onClick={() => setModalType('emitidas')} className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 transition-colors cursor-pointer">
                         Ver detalle... <ChevronRight className="w-3 h-3"/>
                      </button>
                      <div className="flex flex-col items-end">
                        <span className="text-[14px] font-black tracking-tight text-purple-700" title="Facturación Total Emitida">{formatNumber(resumen.imp_facturas || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-red-200 bg-red-50/20 rounded-lg p-5 shadow-sm relative overflow-hidden group">
                    <div className="w-1 h-full bg-red-500 absolute left-0 top-0"></div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Facturas Pte. Cobro</p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <h3 className="text-2xl font-black text-slate-800">{ptesCobro.toLocaleString()}</h3>
                          <span className="text-sm font-bold text-red-500">({pctPteCobro}%)</span>
                        </div>
                      </div>
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="mt-3 border-t border-red-100 pt-2 flex items-center justify-between">
                      <button onClick={() => setModalType('facturas')} className="text-[11px] font-bold text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors cursor-pointer">
                         Ver detalle... <ChevronRight className="w-3 h-3"/>
                      </button>
                      <div className="flex flex-col items-end">
                        <span className="text-[14px] font-black tracking-tight text-red-600" title="Total Pendiente de Cobro">{formatNumber(resumen.imp_pte_cobro || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-teal-200 bg-teal-50/20 rounded-lg p-5 shadow-sm relative overflow-hidden group">
                    <div className="w-1 h-full bg-teal-500 absolute left-0 top-0"></div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Facturas Cobradas</p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <h3 className="text-2xl font-black text-slate-800">{facturasCobradas.toLocaleString()}</h3>
                          <span className="text-sm font-bold text-teal-500">({pctCobradas}%)</span>
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-teal-400" />
                    </div>
                    <div className="mt-3 border-t border-teal-100 pt-2 flex items-center justify-between">
                      <button onClick={() => setModalType('facturas_cobradas')} className="text-[11px] font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 transition-colors cursor-pointer">
                         Ver detalle... <ChevronRight className="w-3 h-3"/>
                      </button>
                      <div className="flex flex-col items-end">
                        <span className="text-[14px] font-black tracking-tight text-teal-600" title="Total Cobrado">{formatNumber(resumen.imp_cobrado || 0)}</span>
                      </div>
                    </div>
                  </div>
                  </>
                );
              })()}
            </div>

            {/* PERFORMANCE METRICS & ALERTS (BY COMPANY) */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-4">
                 <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-3 border-b border-slate-100 pb-2">Alertas Pendientes por Empresa</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-slate-400 border-b border-slate-100">
                           <th className="font-semibold pb-2">EMPRESA</th>
                           <th className="font-semibold pb-2 text-center text-amber-600">REMITOS SIN FACTURA</th>
                           <th className="font-semibold pb-2 text-center text-red-500">FACTURAS SIN COBRO</th>
                           <th className="font-semibold pb-2 text-right">TOTAL DESPACHOS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumen.empresas_stats?.map((emp: any, i: number) => (
                           <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                             <td className="py-2 font-bold text-slate-700">{emp.empresa}</td>
                             <td className="py-2 text-center font-bold text-amber-600">{emp.remitos_pte_fact > 0 ? emp.remitos_pte_fact : '-'}</td>
                             <td className="py-2 text-center font-bold text-red-500">{emp.facturas_pte_cobro > 0 ? emp.facturas_pte_cobro : '-'}</td>
                             <td className="py-2 text-right text-slate-500">{emp.remitos_totales}</td>
                           </tr>
                        ))}
                        {resumen.empresas_stats?.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-slate-400">Sin datos</td></tr>}
                      </tbody>
                    </table>
                 </div>
              </div>

            {/* DATA TABLE (GRILLA) */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col w-full">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Control Detallado de Remitos y Entregas</h2>
                  <p className="text-xs text-slate-500 mt-0.5">La grilla muestra la trazabilidad real de tu operación de venta.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar remito, cliente o producto..." 
                      value={search}
                      onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                      className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                    />
                  </div>
                  <button 
                    onClick={exportExcel}
                    className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors shrink-0 shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Exportar a Excel
                  </button>
                </div>
              </div>
              
              <div className="w-full overflow-x-auto min-h-[400px]">
                <table className="w-full bg-white text-[12px] whitespace-nowrap">
                  <thead className="bg-slate-50 shadow-sm border-b border-slate-200">
                    <tr className="uppercase text-[10px] tracking-wide text-slate-500">
                      <th className="cursor-pointer hover:bg-slate-200 py-3 px-3 text-left" onClick={() => handleSort('empresa')}>
                        <div className="flex items-center gap-1">Empresa <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="cursor-pointer hover:bg-slate-200 py-3 px-3 text-left" onClick={() => handleSort('cliente')}>
                        <div className="flex items-center gap-1">Cliente <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="cursor-pointer hover:bg-slate-200 py-3 px-3 text-left" onClick={() => handleSort('remitonumero')}>
                        <div className="flex items-center gap-1">Remito Nº <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="cursor-pointer hover:bg-slate-200 py-3 px-3 text-left" onClick={() => handleSort('remitofecha')}>
                        <div className="flex items-center gap-1">F. Remito <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="cursor-pointer hover:bg-slate-200 py-3 px-3 text-right text-blue-800 bg-blue-50/50" onClick={() => handleSort('cantidaddespachada')}>
                        <div className="flex items-center justify-end gap-1">Cant. Desp <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="cursor-pointer hover:bg-slate-200 py-3 px-3 text-right text-amber-800 bg-amber-50/50" onClick={() => handleSort('cantidadpendientefacturar')}>
                        <div className="flex items-center justify-end gap-1">Cant. Pte <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="cursor-pointer hover:bg-slate-200 py-3 px-3 text-left text-purple-800 bg-purple-50/50" onClick={() => handleSort('facturanumero')}>
                        <div className="flex items-center gap-1">Factura Nº <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="cursor-pointer hover:bg-slate-200 py-3 px-3 text-right text-purple-800 bg-purple-50/50" onClick={() => handleSort('facturaimporte')}>
                        <div className="flex items-center justify-end gap-1">Imp. Facturado <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="cursor-pointer hover:bg-slate-200 py-3 px-3 text-left text-green-800 bg-green-50/50" onClick={() => handleSort('cobranzanumero')}>
                        <div className="flex items-center gap-1">Recibo Nº <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="cursor-pointer hover:bg-slate-200 py-3 px-3 text-right text-green-800 bg-green-50/50" onClick={() => handleSort('importeaplicado')}>
                        <div className="flex items-center justify-end gap-1">Imp. Cobrado <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="cursor-pointer hover:bg-slate-200 py-3 px-3 text-center" onClick={() => handleSort('estadoproceso')}>
                        <div className="flex items-center justify-center gap-1">Estado<ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTracking.map((t: any, idx: number) => (
                      <tr key={`${t.remitoid}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-slate-500 font-medium">{t.empresa}</td>
                        <td className="py-2.5 px-3 text-slate-800 font-bold truncate max-w-[150px]" title={t.cliente}>{t.cliente}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">{t.remitonumero}</td>
                        <td className="py-2.5 px-3 text-slate-500">{t.remitofecha || '-'}</td>
                        <td className="py-2.5 px-3 text-right text-blue-700 font-bold bg-blue-50/20">{t.cantidaddespachada}</td>
                        <td className="py-2.5 px-3 text-right bg-amber-50/20">
                          {parseFloat(t.cantidadpendientefacturar) > 0 ? (
                            <span className="text-amber-700 font-bold">{t.cantidadpendientefacturar}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-purple-700 font-medium bg-purple-50/20">{t.facturanumero || '-'}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700 bg-purple-50/20">{!isInvalidNum(t.facturaimporte) ? formatNumber(parseFloat(t.facturaimporte)) : '-'}</td>
                        <td className="py-2.5 px-3 text-green-700 font-medium bg-green-50/20">{t.cobranzanumero || '-'}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700 bg-green-50/20">{!isInvalidNum(t.importeaplicado) ? formatNumber(parseFloat(t.importeaplicado)) : '-'}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-1 rounded-sm font-semibold text-[10px] border tracking-wide uppercase ${t.estadoproceso === 'PROCESO COMPLETO' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {t.estadoproceso || 'PENDIENTE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredTracking.length === 0 && (
                      <tr>
                        <td colSpan={11} className="text-center py-12 text-slate-500 text-sm">
                          No se encontraron registros para los filtros seleccionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t border-slate-200 bg-white shrink-0">
                  <span className="text-xs text-slate-500">
                    Mostrando página <span className="font-bold text-slate-700">{currentPage}</span> de <span className="font-bold text-slate-700">{totalPages}</span> 
                    &nbsp;({sortedTracking.length} resultados totales)
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : facturacionStats && activeTab === 'facturacion' ? (
          <div className="flex flex-col gap-6">
            
            {/* RANKING CARDS */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              
              {/* RANKING CLIENTES */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-500" />
                  Top Clientes por Importe Facturado
                </h3>
                <div className="overflow-hidden border border-slate-100 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="py-3 px-4 font-bold uppercase">Cliente</th>
                        <th className="py-3 px-4 font-bold uppercase text-right">Facturas</th>
                        <th className="py-3 px-4 font-bold uppercase text-right">Monto Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facturacionStats.ranking_clientes?.slice(0, 15).map((c: any, i: number) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-blue-50/50 cursor-pointer transition-colors" onClick={() => { setModalType('ranking_clientes'); setModalTitleContext(c.cliente); }}>
                           <td className="py-2.5 px-4 font-bold text-slate-700">
                              <span className="text-[10px] text-slate-400 font-normal mr-2">#{i+1}</span>
                              {c.cliente || 'Consumidor Final'}
                           </td>
                           <td className="py-2.5 px-4 text-slate-500 text-right font-medium">{c.cant_facturas}</td>
                           <td className="py-2.5 px-4 text-blue-700 text-right font-black">
                             {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(c.importe_total)}
                           </td>
                        </tr>
                      ))}
                      {!facturacionStats.ranking_clientes?.length && <tr><td colSpan={3} className="text-center py-4 text-slate-400">Sin datos</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RANKING EMPRESAS */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-purple-500" />
                  Ventas por Empresa Padre
                </h3>
                <div className="overflow-hidden border border-slate-100 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="py-3 px-4 font-bold uppercase">Empresa</th>
                        <th className="py-3 px-4 font-bold uppercase text-right">Facturas</th>
                        <th className="py-3 px-4 font-bold uppercase text-right">Monto Facturado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facturacionStats.ranking_empresas?.map((c: any, i: number) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-purple-50/50 transition-colors">
                           <td className="py-2.5 px-4 font-bold text-slate-700">
                              {c.empresa_padre || 'Generica'}
                           </td>
                           <td className="py-2.5 px-4 text-slate-500 text-right font-medium">{c.cant_facturas}</td>
                           <td className="py-2.5 px-4 text-purple-700 text-right font-black">
                             {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(c.importe_total)}
                           </td>
                        </tr>
                      ))}
                      {!facturacionStats.ranking_empresas?.length && <tr><td colSpan={3} className="text-center py-4 text-slate-400">Sin datos</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              
            </div>

            {/* PRODUCTOS X CLIENTE GRID */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-500" />
                Cantidades de Producto por Cliente
              </h3>
              <div className="overflow-hidden border border-slate-100 rounded-lg max-h-[500px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="py-3 px-4 font-bold uppercase">Cliente</th>
                      <th className="py-3 px-4 font-bold uppercase">Producto</th>
                      <th className="py-3 px-4 font-bold uppercase text-right text-blue-700">Cant. Despachada</th>
                      <th className="py-3 px-4 font-bold uppercase text-right text-emerald-700">Cant. Facturada</th>
                      <th className="py-3 px-4 font-bold uppercase text-right text-amber-600">Cant. Pte Facturar</th>
                      <th className="py-3 px-4 font-bold uppercase text-right text-indigo-700">Importe Facturado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturacionStats.prod_cliente_stats?.map((c: any, i: number) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-emerald-50/50 cursor-pointer transition-colors" onClick={() => { setModalType('prod_cliente'); setModalTitleContext(`${c.cliente}|${c.producto}`); }}>
                         <td className="py-3 px-4 font-bold text-slate-700 max-w-[200px] truncate" title={c.cliente}>{c.cliente || 'Consumidor'}</td>
                         <td className="py-3 px-4 font-medium text-slate-600 max-w-[200px] truncate" title={c.producto}>{c.producto || 'Genérico'}</td>
                         <td className="py-3 px-4 text-blue-600 text-right font-black">{c.cant_despachada > 0 ? c.cant_despachada : '-'}</td>
                         <td className="py-3 px-4 text-emerald-600 text-right font-black">{c.cant_facturada > 0 ? c.cant_facturada : '-'}</td>
                         <td className="py-3 px-4 text-amber-600 text-right font-black">{c.cant_pte > 0 ? c.cant_pte : '-'}</td>
                         <td className="py-3 px-4 text-indigo-700 text-right font-black">{c.importe_producto > 0 ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(c.importe_producto) : '-'}</td>
                      </tr>
                    ))}
                    {!facturacionStats.prod_cliente_stats?.length && <tr><td colSpan={6} className="text-center py-8 text-slate-400">Seleccione filtros para analizar despachos y facturación de productos</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex justify-center items-center h-[50vh] text-slate-400 font-medium">
            Por favor, seleccione sus filtros y presione "Analizar Datos" para visualizar la información.
          </div>
        )}
      </div>

      {/* DETALLE MODAL ALERTS */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                {modalType === 'despachados' && <TrendingUp className="w-5 h-5 text-blue-500" />}
                {modalType === 'remitos_facturados' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                {modalType === 'facturas_cobradas' && <CheckCircle className="w-5 h-5 text-teal-500" />}
                {modalType === 'remitos' && <AlertCircle className="w-5 h-5 text-amber-500" />}
                {modalType === 'facturas' && <AlertCircle className="w-5 h-5 text-red-500" />}
                {modalType === 'emitidas' && <FileText className="w-5 h-5 text-purple-500" />}
                {modalType === 'ranking_clientes' && <DollarSign className="w-5 h-5 text-blue-500" />}
                {modalType === 'prod_cliente' && <Tag className="w-5 h-5 text-emerald-500" />}
                
                {modalType === 'remitos' ? 'Remitos Pendientes de Facturar' 
                : modalType === 'despachados' ? 'Todos los Remitos Despachados' 
                : modalType === 'remitos_facturados' ? 'Remitos YA Facturados' 
                : modalType === 'facturas' ? 'Facturas Pendientes de Cobro' 
                : modalType === 'facturas_cobradas' ? 'Facturas Ya Cobradas' 
                : modalType === 'ranking_clientes' ? `Detalles Facturados: ${modalTitleContext}`
                : modalType === 'prod_cliente' ? `Despachos y Facturas: ${modalTitleContext?.replace('|', ' - ')}`
                : 'Detalle de Facturas Emitidas y Remitos Vinculados'}
              </h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar en el detalle..."
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white transition-all shadow-sm"
                  />
                </div>
                <button onClick={exportModalExcel} className="flex items-center gap-1.5 text-[12px] bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded font-bold shadow-sm transition-colors">
                  <Download className="w-4 h-4"/> Exportar Excel
                </button>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="p-0 overflow-y-auto w-full">
               <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 shadow-sm text-slate-600 z-10">
                     <tr>
                        <th className="py-3 px-4 uppercase font-bold">Empresa</th>
                        <th className="py-3 px-4 uppercase font-bold">Cliente</th>
                        <th className="py-3 px-4 uppercase font-bold">{modalType === 'remitos' || modalType === 'despachados' || modalType === 'remitos_facturados' ? 'Remito Nº' : 'Factura Nº'}</th>
                        {modalType === 'remitos_facturados' && <th className="py-3 px-4 uppercase font-bold text-emerald-700 bg-emerald-50">Factura Vinculada</th>}
                        {modalType === 'emitidas' && <th className="py-3 px-4 uppercase font-bold text-purple-700 bg-purple-50">Remito Vinculado</th>}
                        {modalType === 'facturas_cobradas' && <th className="py-3 px-4 uppercase font-bold text-teal-700 bg-teal-50">Recibo Vinculado</th>}
                        <th className="py-3 px-4 uppercase font-bold">Producto</th>
                        {modalType === 'remitos' && <th className="py-3 px-4 uppercase font-bold text-right text-slate-400">Cant. Org.</th>}
                        {modalType === 'facturas' && <th className="py-3 px-4 uppercase font-bold text-right text-slate-400">Imp. Org.</th>}
                        <th className="py-3 px-4 uppercase font-bold text-right">
                          {modalType === 'remitos' ? 'Cant. Pendiente' : modalType === 'despachados' || modalType === 'remitos_facturados' ? 'Cant. Despachada' : modalType === 'facturas' ? 'Monto Restante' : modalType === 'facturas_cobradas' ? 'Imp. Cobrado' : 'Imp. Facturado'}
                        </th>
                     </tr>
                  </thead>
                  <tbody>
                     {getFilteredModalRows().map((t: any, i: number) => {
                        return (
                           <React.Fragment key={i}>
                             <tr className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4 font-bold text-slate-700">{t.empresa}</td>
                                <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]" title={t.cliente}>{t.cliente}</td>
                                <td className="py-3 px-4 font-semibold text-blue-700">{modalType === 'remitos' || modalType === 'despachados' || modalType === 'remitos_facturados' ? t.remitonumero : t.facturanumero}</td>
                                {modalType === 'remitos_facturados' && (
                                  <td className="py-3 px-4 font-bold text-emerald-600 bg-emerald-50/30">
                                    {t.facturanumero || <span className="text-slate-400 italic font-normal">Sin registro</span>}
                                  </td>
                                )}
                                {modalType === 'emitidas' && (
                                  <td 
                                    className={`py-3 px-4 font-medium transition-colors ${t._remitosList?.length > 0 ? 'text-purple-700 bg-purple-50/40 hover:bg-purple-100 cursor-pointer' : 'text-slate-400 bg-slate-50'}`} 
                                    onClick={() => t._remitosList?.length > 0 && setExpandedFactura(expandedFactura === t.facturanumero ? null : t.facturanumero)}
                                  >
                                    {t._remitosList?.length > 0 ? (
                                      <div className="flex items-center gap-1.5">
                                        <span className="underline decoration-purple-300 font-bold">{t._remitosList.length} Remito{t._remitosList.length > 1 ? 's' : ''}</span>
                                        <ChevronDown className={`w-3.5 h-3.5 text-purple-500 transition-transform ${expandedFactura === t.facturanumero ? 'rotate-180' : ''}`} />
                                      </div>
                                    ) : (
                                      <span className="italic text-xs">SIN REMITO</span>
                                    )}
                                  </td>
                                )}
                                {modalType === 'facturas_cobradas' && (
                                  <td className="py-3 px-4 font-bold text-teal-600 bg-teal-50/30">
                                    {(t._cobranzasList ? t._cobranzasList.join(', ') : t.cobranzanumero) || <span className="text-slate-400 italic font-normal">Sin Número</span>}
                                  </td>
                                )}
                                <td className="py-3 px-4 text-slate-600 truncate max-w-[200px]" title={t.producto}>{t.producto || '-'}</td>
                                
                                {modalType === 'remitos' && (
                                  <td className="py-3 px-4 text-right font-medium text-slate-400">{t.cantidaddespachada}</td>
                                )}
                                {(modalType === 'facturas' || modalType === 'facturas_cobradas') && (
                                  <td className="py-3 px-4 text-right font-medium text-slate-400">{formatNumber(t._impFac)}</td>
                                )}

                                <td className={`py-3 px-4 text-right font-black ${modalType === 'remitos' || modalType === 'facturas' ? 'text-red-500' : modalType === 'remitos_facturados' ? 'text-emerald-600' : modalType === 'facturas_cobradas' ? 'text-teal-600' : 'text-slate-700'}`}>
                                   {modalType === 'remitos' ? t.cantidadpendientefacturar : modalType === 'despachados' || modalType === 'remitos_facturados' ? t.cantidaddespachada : modalType === 'facturas' ? formatNumber(t._restante) : modalType === 'facturas_cobradas' ? formatNumber(t._impFac - t._restante) : (t._impFac > 0 ? formatNumber(t._impFac) : '-')}
                                </td>
                             </tr>
                             {modalType === 'emitidas' && expandedFactura === t.facturanumero && t._remitosList?.length > 0 && (
                               <tr className="bg-purple-50/20 shadow-inner">
                                  <td colSpan={6} className="px-6 py-4 border-b border-purple-100">
                                     <div className="bg-white border border-purple-100 rounded-lg p-3 shadow-sm">
                                        <div className="text-[10px] font-black text-purple-800 mb-2 uppercase tracking-wide border-b border-purple-50 pb-1">Detalle: {t._remitosList.length} Remito(s) de Venta</div>
                                        <table className="w-full text-xs">
                                           <tbody>
                                             {t._remitosList.map((r: any, idx: number) => (
                                                <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                                   <td className="py-1.5 font-bold text-slate-700 w-1/3 flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-300" /> {r.remitonumero}</td>
                                                   <td className="py-1.5 text-slate-500">{r.producto}</td>
                                                </tr>
                                             ))}
                                           </tbody>
                                        </table>
                                     </div>
                                  </td>
                               </tr>
                             )}
                           </React.Fragment>
                        );
                     })}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
