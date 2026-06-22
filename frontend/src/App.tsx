import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, Building2, PackageCheck, TrendingUp, DollarSign, FileText, Filter, Calendar, LayoutDashboard, Search, ChevronDown, ChevronUp, ChevronRight, BarChart3, Presentation, Download, LogOut, Settings, Users, Save, X, Trash2, Edit2, Send, Check, Loader2, Shield, Bell, Wallet, Info, AlertCircle, Wrench, Package, Paperclip, Truck, PieChart } from 'lucide-react';
import ConfiguracionAvanzada from './components/ConfiguracionAvanzada';
import ConfiguracionCentrosCosto from './components/ConfiguracionCentrosCosto';
import ConfiguracionEquipos from './components/ConfiguracionEquipos';
import ErrorBoundary from './components/ErrorBoundary';
import InformeGestion from './components/InformeGestion';
import GestorInformes from './components/GestorInformes';
import ConsumosInventarios from './components/ConsumosInventarios';
import Equipos from './components/Equipos';
import Transportes from './components/Transportes';
import CertificadosObras from './components/CertificadosObras';
import DashboardConsolidado from './components/DashboardConsolidado';
import { Briefcase } from 'lucide-react';
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

export const MultiSelect = ({ label, options, selected, onChange, singleSelection = false }: { label: string, options: string[], selected: string[], onChange: (v: string[]) => void, singleSelection?: boolean }) => {
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
    if (singleSelection) {
      if (option !== 'Todos' && option !== 'Todas') {
        onChange([option]);
        setIsOpen(false);
      } else {
        onChange([option]);
        setIsOpen(false);
      }
      return;
    }

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

function Dashboard({ token, onLogout, defaultUnidad, defaultPeriodo }: { token: string, onLogout: () => void, defaultUnidad?: string, defaultPeriodo?: string }) {
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

  const [rawData, setRawData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const currentYear = new Date().getFullYear();
  const currentPeriod = `${currentMonth}/${currentYear}`;

  // Filters state (Pending - modified by UI)
  const [pendingFilters, setPendingFilters] = useState({
    periodo: [defaultPeriodo || currentPeriod],
    empresa: [defaultUnidad || 'Todas'],
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

  useEffect(() => {
    if (defaultUnidad && defaultPeriodo) {
      setPendingFilters(prev => ({
        ...prev,
        empresa: [defaultUnidad],
        periodo: [defaultPeriodo]
      }));
      setAppliedFilters(prev => ({
        ...prev,
        empresa: [defaultUnidad],
        periodo: [defaultPeriodo]
      }));
    }
  }, [defaultUnidad, defaultPeriodo]);

  const [uploading, setUploading] = useState(false);

  const [selectedAjustes, setSelectedAjustes] = useState<Set<number>>(new Set());
  
  const handleSelectAjuste = (id: number) => {
    const newSet = new Set(selectedAjustes);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedAjustes(newSet);
  };
  
  const handleSelectAllAjustes = () => {
    const ajustes = filteredGridData.filter((c: any) => c.origen === 'AJUSTE EXCEL' && c.id_ajuste);
    if (selectedAjustes.size === ajustes.length && ajustes.length > 0) {
      setSelectedAjustes(new Set());
    } else {
      setSelectedAjustes(new Set(ajustes.map((c: any) => c.id_ajuste)));
    }
  };
  
  const handleDeleteSelected = async () => {
    if (selectedAjustes.size === 0) return;
    const confirmed = await showConfirm(`¿Eliminar ${selectedAjustes.size} ajustes seleccionados?`);
    if (!confirmed) return;
    
    setUploading(true);
    try {
      await apiFetch('/api/config/ajustes-excel/bulk', token, {
        method: 'DELETE',
        body: JSON.stringify({ ids: Array.from(selectedAjustes) })
      });
      setSelectedAjustes(new Set());
      apiFetch('/api/indicadores', token).then(res_json => {
        setRawData(res_json.data || []);
        setColumns(res_json.columns || []);
      });
    } catch (e) {
      console.error(e);
      await showAlert('Error eliminando ajustes');
    } finally {
      setUploading(false);
    }
  };

  const [uploadMsg, setUploadMsg] = useState('');

  const [reportClosed, setReportClosed] = useState(false);
  const activeUnidad = appliedFilters.empresa.includes('Todas') ? (defaultUnidad || '') : appliedFilters.empresa[0];
  const activePeriodo = appliedFilters.periodo.includes('Todos') ? currentPeriod : appliedFilters.periodo[0];

  useEffect(() => {
    if (activeUnidad && activePeriodo) {
      const pStr = activePeriodo.replace('/', '-');
      apiFetch(`/api/informes/estado?unidad_negocio=${encodeURIComponent(activeUnidad)}&periodo=${encodeURIComponent(pStr)}`, token)
        .then(res => {
          if (res.existe && res.estado === 'CERRADO') {
            setReportClosed(true);
          } else {
            setReportClosed(false);
          }
        })
        .catch(e => {
          console.error("Error fetching report state:", e);
          setReportClosed(false);
        });
    }
  }, [activeUnidad, activePeriodo, token]);

  
  const downloadTemplate = () => {
    const ws_data = [
      ['Fecha', 'Comprobante', 'Concepto', 'Importe'],
      ['04/05/2026', 'A-0002-0002343', 'Ingresos adicionales', 1500.50]
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wscols = [{wch:15}, {wch:20}, {wch:35}, {wch:15}];
    ws['!cols'] = wscols;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Ajustes");
    XLSX.writeFile(wb, `Plantilla_Ingresos.xlsx`);
  };

  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [uploadTipo, setUploadTipo] = useState<'INGRESO' | 'COSTO'>('INGRESO');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, tipoMovimiento: 'INGRESO' | 'COSTO') => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setPendingFile(file);
    setPreviewError(null);
    setPreviewRows([]);
    setUploadTipo(tipoMovimiento);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[];

        if (rawRows.length === 0) {
          throw new Error("El archivo Excel está vacío.");
        }

        const headers = (rawRows[0] || []).map((h: any) => String(h || "").trim().toLowerCase());
        
        const idxFecha = headers.indexOf("fecha");
        const idxComprobante = headers.indexOf("comprobante");
        const idxConcepto = headers.indexOf("concepto");
        const idxImporte = headers.indexOf("importe");

        if (idxFecha === -1 || idxComprobante === -1 || idxConcepto === -1 || idxImporte === -1) {
          throw new Error("Estructura de columnas inválida. Debe tener exactamente las columnas: Fecha, Comprobante, Concepto, Importe.");
        }

        const parsed: any[] = [];
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0 || row.every((cell: any) => cell === null || cell === undefined || cell === '')) {
            continue; // fila vacia
          }

          const rawFecha = row[idxFecha];
          const rawComprobante = row[idxComprobante];
          const rawConcepto = row[idxConcepto];
          const rawImporte = row[idxImporte];

          // Validar Fecha
          let displayFecha = "";
          let isFechaValid = true;
          if (rawFecha instanceof Date) {
            const d = rawFecha;
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            displayFecha = `${day}/${month}/${year}`;
          } else if (rawFecha) {
            const strF = String(rawFecha).trim();
            displayFecha = strF;
            isFechaValid = /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(strF) || /^\d{4}-\d{2}-\d{2}$/.test(strF);
          } else {
            isFechaValid = false;
          }

          // Validar Comprobante (max 15)
          const compStr = String(rawComprobante || "").trim();
          const displayComprobante = compStr.length > 15 ? compStr.substring(0, 15) : compStr;
          const isCompWarning = compStr.length > 15;

          // Validar Concepto (max 30)
          const conceptStr = String(rawConcepto || "").trim();
          const displayConcepto = conceptStr.length > 30 ? conceptStr.substring(0, 30) : conceptStr;
          const isConceptWarning = conceptStr.length > 30;

          // Validar Importe
          const parsedImporte = parseFloat(String(rawImporte).replace(/[^0-9.-]/g, ''));
          const isImporteValid = !isNaN(parsedImporte);

          parsed.push({
            rowIdx: i + 1,
            fecha: displayFecha,
            isFechaValid,
            comprobante: displayComprobante,
            isCompWarning,
            concepto: displayConcepto,
            isConceptWarning,
            importe: isImporteValid ? parsedImporte : 0,
            isImporteValid,
            rawRow: row
          });
        }

        setPreviewRows(parsed);
        setShowPreview(true);
      } catch (err: any) {
        setPreviewError(err.message);
        setShowPreview(true);
      }
    };
    reader.onerror = () => {
      setPreviewError("Error al leer el archivo.");
      setShowPreview(true);
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // reset
  };

  const confirmImport = async () => {
    if (!pendingFile) return;
    setUploading(true);
    setUploadMsg('');
    setShowPreview(false);

    const formData = new FormData();
    formData.append("file", pendingFile);
    formData.append("unidad", appliedFilters.empresa.includes('Todas') ? (defaultUnidad || '') : appliedFilters.empresa[0]);
    formData.append("periodo", appliedFilters.periodo.includes('Todos') ? currentPeriod : appliedFilters.periodo[0]);
    formData.append("tipo", uploadTipo);

    try {
      const res = await fetch('/api/config/ajustes-excel', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      const json = await res.json();
      if (json.status === 'ok') {
        setUploadMsg(`✅ Importado exitosamente (${json.inserted} filas)`);
        setTimeout(() => setUploadMsg(''), 5000);
        // Recargar datos
        apiFetch('/api/indicadores', token)
          .then(res_json => {
            setRawData(res_json.data || []);
            setColumns(res_json.columns || []);
          });
      } else {
        setUploadMsg(`⚠️ Importado con errores. ${json.inserted} filas creadas.`);
      }
    } catch(err: any) {
      setUploadMsg('❌ Error al subir: ' + err.message);
    }
    setUploading(false);
    setPendingFile(null);
    setPreviewRows([]);
  };



  const [showAjustesModal, setShowAjustesModal] = useState(false);
  const [ajustesList, setAjustesList] = useState<any[]>([]);
  const [loadingAjustes, setLoadingAjustes] = useState(false);

  const fetchAjustes = useCallback(async () => {
    setLoadingAjustes(true);
    try {
      const res = await apiFetch('/api/config/ajustes-excel', token);
      const currentUnidad = appliedFilters.empresa.includes('Todas') ? (defaultUnidad || '') : appliedFilters.empresa[0];
      const currentPer = appliedFilters.periodo.includes('Todos') ? currentPeriod : appliedFilters.periodo[0];
      
      const filtered = (res || []).filter((a: any) => 
         a.tipo_movimiento === 'INGRESO' &&
         a.unidad_negocio === currentUnidad &&
         a.periodo === currentPer
      );
      setAjustesList(filtered);
    } catch(err) {
      console.error(err);
    }
    setLoadingAjustes(false);
  }, [appliedFilters.empresa, appliedFilters.periodo, defaultUnidad, currentPeriod, token]);

  useEffect(() => {
    if (showAjustesModal) {
      fetchAjustes();
    }
  }, [showAjustesModal, fetchAjustes]);

  const handleDeleteAjuste = async (id: number) => {
    const confirmed = await showConfirm("¿Estás seguro de eliminar este registro importado? Esto modificará los indicadores.");
    if (!confirmed) return;
    try {
      await apiFetch(`/api/config/ajustes-excel/${id}`, token, { method: 'DELETE' });
      fetchAjustes();
      apiFetch('/api/indicadores', token).then(res_json => {
          setRawData(res_json.data || []);
          setColumns(res_json.columns || []);
      });
    } catch(err: any) {
      await showAlert("Error al eliminar: " + err.message);
    }
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
    return filteredData.map(d => {
      const isAjuste = d.origen === 'AJUSTE EXCEL' || d._original['origen'] === 'AJUSTE EXCEL';
      const idAjuste = d._original['id_ajuste'] || d.id_ajuste;
      return {
        id: isAjuste && idAjuste ? `EXCEL-${idAjuste}` : (d._original['Comprobante'] || d._original['comprobante'] || 'Sin ID'),
        comprobante: d._original['Comprobante'] || d._original['comprobante'] || 'Sin ID',
        fecha: d._fecha,
        prestador: d._empresa || d._original['Empresa'] || '-',
        clienteEmpresa: d._cliente_empresa || '-',
        descripcion: d._descripcion,
        unidad: d._unidad,
        estado: d._estado,
        total: d._total,
        items: d._original['items'] || [],
        origen: d.origen || d._original['origen'],
        id_ajuste: idAjuste
      };
    }).sort((a, b) => b.total - a.total);
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
      <div className="max-w-[1800px] w-full mx-auto px-6 py-6 space-y-6">
        
        {/* Title Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="text-blue-600 h-6 w-6" />
              Ingresos
            </h2>
            <p className="text-sm text-slate-500">
              Detalle de los comprobantes de ingresos valorizados para <span className="font-bold text-slate-700">{(appliedFilters.empresa?.[0] === 'Todas' ? 'Todas las Sucursales' : appliedFilters.empresa?.[0]) || defaultUnidad}</span> en el período <span className="font-bold text-slate-700">{(appliedFilters.periodo?.[0]) || defaultPeriodo}</span>.
            </p>
          </div>
          
          {/* Search Input in Header */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4.5 w-4.5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por comprobante o descripción..."
              value={gridFilters.search}
              onChange={(e) => setGridFilters({...gridFilters, search: e.target.value})}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/55 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
            />
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100">
              <Filter size={18} strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Filtros de Análisis</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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
            <div className="bg-slate-50/55 p-3 rounded-xl border border-slate-200/60 flex-1 max-w-lg flex items-center gap-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 w-24 border-r border-slate-200/80 pr-3">Fechas</label>
              <div className="flex items-center gap-3 w-full">
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Desde</label>
                  <input 
                    type="date" 
                    className="w-full border border-slate-200 rounded-lg text-sm bg-white p-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700"
                    value={pendingFilters.fechaDesde}
                    onChange={e => setPendingFilters({...pendingFilters, fechaDesde: e.target.value})}
                  />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Hasta</label>
                  <input 
                    type="date" 
                    className="w-full border border-slate-200 rounded-lg text-sm bg-white p-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700"
                    value={pendingFilters.fechaHasta}
                    onChange={e => setPendingFilters({...pendingFilters, fechaHasta: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <button 
              onClick={applyFilters}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm shrink-0 border border-blue-600 cursor-pointer"
            >
              <Search size={18} />
              Actualizar Resultados
            </button>
          </div>
        </div>

        {/* Indicators Grid - Financial KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Neto Gravado */}
          <div className="bg-gradient-to-br from-white to-blue-50/10 p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
              <DollarSign size={80} className="text-blue-600" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <DollarSign size={20} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Neto Gravado</span>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-2xl font-black text-slate-800">
                  ${kpis.netoGravado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-xs text-slate-500">Neto gravado del período</p>
              </div>
            </div>
          </div>

          {/* IVA (21%) */}
          <div className="bg-gradient-to-br from-white to-indigo-50/10 p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
              <TrendingUp size={80} className="text-indigo-600" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <TrendingUp size={20} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">IVA (21%)</span>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-2xl font-black text-slate-800">
                  ${kpis.iva.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-xs text-slate-500">Impuesto sobre el Valor Añadido</p>
              </div>
            </div>
          </div>

          {/* Total Consolidado */}
          <div className="bg-gradient-to-br from-white to-emerald-50/10 p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
              <DollarSign size={80} className="text-emerald-600" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <DollarSign size={20} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Consolidado</span>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-2xl font-black text-slate-800">
                  ${kpis.totalConsolidado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-xs text-slate-500">Importe total consolidado</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* KPIs Operativos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-white to-slate-50/10 p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100"><FileText size={24} /></div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Volumen Operativo</p>
              <h3 className="text-2xl font-black text-slate-800">{comprobantesData.length} <span className="text-xs font-semibold text-slate-400">comprob.</span></h3>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-slate-50/10 p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100"><Building2 size={24} /></div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Alcance</p>
              <h3 className="text-2xl font-black text-slate-800">{kpis.alcance} <span className="text-xs font-semibold text-slate-400">unidades</span></h3>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-slate-50/10 p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-5 hover:shadow-md transition-all relative overflow-hidden">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 z-10"><Presentation size={24} /></div>
            <div className="z-10">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Autorizados</p>
              <h3 className="text-2xl font-black text-slate-800">{kpis.pctAutorizado.toFixed(0)}% <span className="text-xs font-semibold text-slate-400">({kpis.qtyAutorizados})</span></h3>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-amber-500 transition-all" style={{width: `${kpis.pctAutorizado}%`}}></div>
          </div>
        </div>

        {/* Gráficos de Distribución */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <HorizontalBarChart title="Por Producto" data={agrupaciones.concepto} icon={PackageCheck} colorTheme="indigo" />
          <HorizontalBarChart title="Por Prestador" data={agrupaciones.empresa} icon={Building2} colorTheme="slate" />
          <HorizontalBarChart title="Por Cliente Empresa" data={agrupaciones.cliente} icon={Building2} colorTheme="blue" />
          <HorizontalBarChart title="Por Cliente UN" data={agrupaciones.unidad} icon={BarChart3} colorTheme="teal" showAuthSplit={true} />
        </div>

        {/* Data Table - Grilla Detalle */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200/60 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <LayoutDashboard size={20} className="text-blue-600" />
              Comprobantes Emitidos
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50">{filteredGridData.length} resultados</span>
              <button
                onClick={() => {
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
                  const ws = XLSX.utils.json_to_sheet(rows);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Comprobantes Emitidos");
                  XLSX.writeFile(wb, `Comprobantes_Emitidos_${new Date().toISOString().slice(0,10)}.xlsx`);
                }}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Download size={14} />
                Descargar XLSX
              </button>
              
              {selectedAjustes.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  <Trash2 size={14} />
                  Eliminar seleccionados ({selectedAjustes.size})
                </button>
              )}

              <button
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Download size={14} />
                Descargar Plantilla
              </button>

              <div className="relative">
                <input type="file" id="upload-ingresos" className="hidden" accept=".xlsx,.xls" onChange={(e) => handleFileSelect(e, 'INGRESO')} />
                <label htmlFor="upload-ingresos" className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer border border-blue-600">
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                  Importar adicionales de Ingresos
                </label>
                {uploadMsg && <span className="absolute top-full mt-1 right-0 text-xs font-medium bg-white px-2 py-1 shadow-sm rounded text-slate-700 whitespace-nowrap z-50">{uploadMsg}</span>}
              </div>
              <button
                onClick={() => setShowAjustesModal(true)}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Settings size={14} />
                Importaciones Adicionales
              </button>
            </div>
          </div>
          
          {/* Modal Ver Ajustes Importados */}
          {showAjustesModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Settings size={18} className="text-blue-600" />
                    Importaciones Adicionales (Ingresos)
                  </h3>
                  <button onClick={() => setShowAjustesModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-4 overflow-auto flex-1">
                  {loadingAjustes ? (
                    <div className="flex items-center justify-center py-8 text-slate-500 gap-2"><Loader2 className="animate-spin" size={20}/> Cargando...</div>
                  ) : ajustesList.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">No hay ajustes importados para este periodo y unidad.</div>
                  ) : (
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-3 font-semibold text-slate-600">Fecha Carga</th>
                          <th className="p-3 font-semibold text-slate-600">Concepto</th>
                          <th className="p-3 font-semibold text-slate-600">Categoría</th>
                          <th className="p-3 font-semibold text-slate-600 text-right">Importe</th>
                          <th className="p-3 font-semibold text-slate-600 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ajustesList.map(a => (
                          <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-3 text-slate-600">{new Date(a.fecha_carga).toLocaleDateString()}</td>
                            <td className="p-3 text-slate-800 font-medium">{a.concepto}</td>
                            <td className="p-3 text-slate-600">{a.categoria}</td>
                            <td className="p-3 text-right font-mono font-medium text-slate-800">
                              {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(a.importe)}
                            </td>
                            <td className="p-3 text-center">
                              <button onClick={() => handleDeleteAjuste(a.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer" title="Eliminar">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {showPreview && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <FileText className="text-blue-600" />
                      Vista Previa de Importación ({uploadTipo === 'INGRESO' ? 'Ingresos' : 'Costos'})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Verifica los datos de la planilla antes de confirmar la carga.</p>
                  </div>
                  <button 
                    onClick={() => { setShowPreview(false); setPendingFile(null); }}
                    className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                  {previewError ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
                      <AlertCircle className="shrink-0 mt-0.5" size={20} />
                      <div>
                        <h4 className="font-bold text-sm">Error de Validación</h4>
                        <p className="text-sm mt-1">{previewError}</p>
                      </div>
                    </div>
                  ) : previewRows.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      No se encontraron filas de datos para importar.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto max-h-[45vh]">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
                              <tr>
                                <th className="px-4 py-3 text-slate-500 font-bold text-xs uppercase tracking-wider w-16">Fila</th>
                                <th className="px-4 py-3 text-slate-500 font-bold text-xs uppercase tracking-wider">Fecha</th>
                                <th className="px-4 py-3 text-slate-500 font-bold text-xs uppercase tracking-wider">Comprobante</th>
                                <th className="px-4 py-3 text-slate-500 font-bold text-xs uppercase tracking-wider">Concepto</th>
                                <th className="px-4 py-3 text-slate-500 font-bold text-xs uppercase tracking-wider text-right">Importe</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {previewRows.map((r, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{r.rowIdx}</td>
                                  <td className="px-4 py-3">
                                    <span className={r.isFechaValid ? "text-slate-700" : "text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200 text-xs"}>
                                      {r.fecha || 'Vacío'} {!r.isFechaValid && '⚠️'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-slate-900 font-medium">
                                      {r.comprobante || 'S/N'}
                                    </span>
                                    {r.isCompWarning && (
                                      <span className="ml-1 text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-200" title="Se truncará a 15 caracteres">
                                        Truncado
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-slate-700">
                                      {r.concepto}
                                    </span>
                                    {r.isConceptWarning && (
                                      <span className="ml-1 text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-200" title="Se truncará a 30 caracteres">
                                        Truncado
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                    <span className={r.isImporteValid ? "text-slate-900" : "text-red-600 font-semibold"}>
                                      ${r.importe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {/* Resumen */}
                      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Total a importar: <strong className="text-slate-700">{previewRows.length}</strong> registros</span>
                        <span className="text-slate-700 font-bold flex items-center gap-1.5">
                          Suma Total: 
                          <span className="text-base text-blue-700 font-black">
                            ${previewRows.reduce((sum, r) => sum + r.importe, 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    onClick={() => { setShowPreview(false); setPendingFile(null); }}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmImport}
                    disabled={!!previewError || previewRows.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-5 rounded-lg text-sm transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    Confirmar Importación
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Filtros Locales de la Grilla */}
          <div className="p-4 border-b border-slate-200/60 bg-white grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <select 
                className="w-full border border-slate-200 rounded-xl text-sm bg-slate-50/55 p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700 cursor-pointer"
                value={gridFilters.unidad}
                onChange={e => setGridFilters({...gridFilters, unidad: e.target.value})}
              >
                <option value="Todas">Cliente UN: Todos</option>
                {gridOptions.unidades.filter(o => o !== 'Todas').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <select 
                className="w-full border border-slate-200 rounded-xl text-sm bg-slate-50/55 p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700 cursor-pointer"
                value={gridFilters.empresa}
                onChange={e => setGridFilters({...gridFilters, empresa: e.target.value})}
              >
                <option value="Todas">Prestador: Todos</option>
                {gridOptions.empresas.filter(o => o !== 'Todas').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <select 
                className="w-full border border-slate-200 rounded-xl text-sm bg-slate-50/55 p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700 cursor-pointer"
                value={gridFilters.cliente}
                onChange={e => setGridFilters({...gridFilters, cliente: e.target.value})}
              >
                <option value="Todos">Cliente Empresa: Todos</option>
                {gridOptions.clientes.filter((o: string) => o !== 'Todos').map((o: string) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <select 
                className="w-full border border-slate-200 rounded-xl text-sm bg-slate-50/55 p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700 cursor-pointer"
                value={gridFilters.estado}
                onChange={e => setGridFilters({...gridFilters, estado: e.target.value})}
              >
                <option value="Todos">Estado: Todos</option>
                {gridOptions.estados.filter(o => o !== 'Todos').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[1200px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/85">
                  <th className="px-6 py-4 w-8 text-center bg-slate-50/50"></th>
                  <th className="px-6 py-4 w-10 text-center bg-slate-50/50">
                    <input type="checkbox" onChange={handleSelectAllAjustes} className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50 whitespace-nowrap">Fecha</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50 whitespace-nowrap">Comprobante</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">Descripción</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50 whitespace-nowrap">Unidad de Negocio</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50 whitespace-nowrap">Prestador</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50 text-right pr-6 whitespace-nowrap">Total Consolidado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGridData.map((comp: any) => {
                  const isExpanded = expandedRows.has(comp.id);
                  return (
                    <React.Fragment key={comp.id}>
                      <tr 
                        className={`hover:bg-slate-50/55 transition-colors cursor-pointer group ${comp.origen === 'AJUSTE EXCEL' ? 'bg-amber-50/20 hover:bg-amber-100/20' : ''} ${isExpanded ? 'bg-blue-50/20' : ''}`}
                        onClick={(e) => {
                          // Evitar toggle si se hace click en el checkbox
                          if ((e.target as HTMLElement).tagName !== 'INPUT') {
                            toggleRow(comp.id);
                          }
                        }}
                      >
                        <td className="px-6 py-3.5 text-slate-400 text-center">
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </td>
                        <td className="px-6 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          {comp.origen === 'AJUSTE EXCEL' && comp.id_ajuste && (
                            <input 
                              type="checkbox" 
                              checked={selectedAjustes.has(comp.id_ajuste)}
                              onChange={() => handleSelectAjuste(comp.id_ajuste)}
                              className="rounded border-amber-350 text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-500 whitespace-nowrap">{comp.fecha}</td>
                        <td className="px-6 py-3.5 text-sm"><span className="text-slate-900 font-bold bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200 whitespace-nowrap">{comp.comprobante}</span></td>
                        <td className="px-6 py-3.5 text-sm text-slate-650 max-w-[200px]" title={comp.descripcion}>
                          <div className="truncate">{comp.descripcion}</div>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-700 font-bold max-w-[220px]" title={comp.unidad}>
                          <div className="truncate">{comp.unidad}</div>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-700 font-medium max-w-[200px]" title={comp.cliente}>
                          <div className="truncate">{comp.cliente}</div>
                        </td>
                        <td className="px-6 py-3.5 text-sm whitespace-nowrap"><span className={`px-2 py-1 rounded text-xs font-bold border ${comp.estado === 'Autorizado' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-amber-700 bg-amber-50 border-amber-100'}`}>{comp.estado}</span></td>
                        <td className="px-6 py-3.5 text-sm font-extrabold text-blue-600 bg-blue-50/10 group-hover:bg-blue-50/20 text-right pr-6 whitespace-nowrap">${comp.total.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                      </tr>
                      
                      {/* Fila Expandible con Detalle */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="bg-slate-50/80 p-0 border-b border-slate-200">
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
                    <td colSpan={9} className="px-6 py-16 text-center text-slate-400 font-medium">
                      <Search size={40} className="mx-auto text-slate-300 mb-3" />
                      Sin resultados. Ajuste los filtros para ver más información.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer summary */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-500 tracking-wider">
            <span>MOSTRANDO {filteredGridData.length} DE {comprobantesData.length} REGISTROS</span>
            <span className="text-slate-700 font-extrabold text-sm">
              TOTAL: ${kpis.totalConsolidado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          </div>

          {/* Documentos de Respaldo */}
          <div className="mt-6">
            <DocumentosRespaldo
              token={token}
              tipoDocumento="INGRESOS_VENTAS_INTERNAS"
              unidadNegocio={activeUnidad}
              periodo={activePeriodo}
              reportClosed={reportClosed}
            />
        </div>
      </div>
      {renderCustomDialog()}
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
const ROLES_MAP: Record<string, string> = { admin: 'Administrador', responsable_un: 'Responsable U.N.', consulta: 'Solo Consulta', consulta_general: 'Consulta General' };

function Configuracion({ token }: { token: string }) {
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
  const [configTab, setConfigTab] = useState<'usuarios' | 'audit' | 'ingresos' | 'costos-asientos' | 'costos-compras' | 'centros-costo' | 'unidades' | 'ajustes-excel' | 'equipos'>('usuarios');
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
    const confirmed = await showConfirm('¿Eliminar este usuario?');
    if (!confirmed) return;
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
    <div className="max-w-[1800px] w-full mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><Settings size={28} /></div>
          <div><h2 className="text-2xl font-bold text-slate-800">Configuración</h2><p className="text-sm text-slate-500">Gestión de usuarios y auditoría</p></div>
        </div>
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl self-start sm:self-auto gap-1">
          <button onClick={() => setConfigTab('usuarios')} className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors ${configTab === 'usuarios' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>Usuarios</button>
          <button onClick={() => setConfigTab('audit')} className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors ${configTab === 'audit' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>Auditoría</button>
          <button onClick={() => setConfigTab('ingresos')} className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors ${configTab === 'ingresos' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>Conf. Ingresos</button>
          <button onClick={() => setConfigTab('costos-asientos')} className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors ${configTab === 'costos-asientos' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>Conf. Asientos</button>
          <button onClick={() => setConfigTab('costos-compras')} className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors ${configTab === 'costos-compras' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>Conf. Costos Compras</button>
          <button onClick={() => setConfigTab('centros-costo')} className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors ${configTab === 'centros-costo' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>Conf. Centros de Costo</button>
          <button onClick={() => setConfigTab('equipos')} className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors ${configTab === 'equipos' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>Conf. Equipos</button>

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
              <option value="admin">Administrador</option><option value="responsable_un">Responsable U.N.</option><option value="consulta">Solo Consulta</option><option value="consulta_general">Consulta General</option>
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
        <ErrorBoundary>
          <ConfiguracionCentrosCosto token={token} />
        </ErrorBoundary>
      ) : configTab === 'equipos' ? (
        <ErrorBoundary>
          <ConfiguracionEquipos token={token} />
        </ErrorBoundary>
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
      {renderCustomDialog()}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// NEW EMPTY TABS (Dashboard & Costos)
// ═══════════════════════════════════════════════════════
function MainDashboard({ token, defaultUnidad, defaultPeriodo }: { token: string, defaultUnidad?: string, defaultPeriodo?: string }) {
  return (
    <div className="bg-slate-50 min-h-screen pb-12 overflow-x-hidden">
      <InformeGestion token={token} mode="dashboard" defaultUnidad={defaultUnidad} defaultPeriodo={defaultPeriodo} />
    </div>
  );
}

function Ingresos({ token, onLogout, defaultUnidad, defaultPeriodo }: { token: string, onLogout: () => void, defaultUnidad?: string, defaultPeriodo?: string }) {
  const [subTab, setSubTab] = useState<'comprobantes' | 'obras'>('comprobantes');

  return (
    <div className="bg-slate-50 min-h-screen pb-12 overflow-x-hidden font-sans">
      <div className="bg-white border-b border-slate-200 shadow-sm mb-4">
        <div className="max-w-[1800px] mx-auto px-6 flex items-center h-10 gap-1 overflow-x-auto whitespace-nowrap scrollbar-none">
          <button 
            onClick={() => setSubTab('comprobantes')}
            className={`px-4 h-full text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${subTab === 'comprobantes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <TrendingUp size={13} /> Comprobantes de Ingresos (Ventas Internas)
          </button>
          <button 
            onClick={() => setSubTab('obras')}
            className={`px-4 h-full text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${subTab === 'obras' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Briefcase size={13} /> Certificados de Obras (Soporte)
          </button>
        </div>
      </div>

      {subTab === 'comprobantes' && <Dashboard token={token} onLogout={onLogout} defaultUnidad={defaultUnidad} defaultPeriodo={defaultPeriodo} />}
      {subTab === 'obras' && <CertificadosObras token={token} unidadNegocio={defaultUnidad!} periodo={defaultPeriodo!} />}
    </div>
  );
}

function Costos({ token, defaultUnidad, defaultPeriodo }: { token: string, defaultUnidad?: string, defaultPeriodo?: string }) {
  const [subTab, setSubTab] = useState<'resumen' | 'rrhh' | 'consumos' | 'equipos' | 'transportes'>('resumen');

  return (
    <div className="bg-slate-50 min-h-screen pb-12 overflow-x-hidden font-sans">
      <div className="bg-white border-b border-slate-200 shadow-sm mb-4">
        <div className="max-w-[1800px] mx-auto px-6 flex items-center h-10 gap-1 overflow-x-auto whitespace-nowrap scrollbar-none">
          <button 
            onClick={() => setSubTab('resumen')}
            className={`px-4 h-full text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${subTab === 'resumen' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Wallet size={13} /> Resumen de Costos
          </button>
          <button 
            onClick={() => setSubTab('rrhh')}
            className={`px-4 h-full text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${subTab === 'rrhh' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Users size={13} /> Recursos Humanos (Soporte)
          </button>
          <button 
            onClick={() => setSubTab('consumos')}
            className={`px-4 h-full text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${subTab === 'consumos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Package size={13} /> Consumos de Inventarios (Soporte)
          </button>
          <button 
            onClick={() => setSubTab('equipos')}
            className={`px-4 h-full text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${subTab === 'equipos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Wrench size={13} /> Certificaciones de Equipos (Soporte)
          </button>
          <button 
            onClick={() => setSubTab('transportes')}
            className={`px-4 h-full text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${subTab === 'transportes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Truck size={13} /> Certificaciones de Transportes/Fletes (Soporte)
          </button>
        </div>
      </div>

      {subTab === 'resumen' && <InformeGestion token={token} mode="costos" defaultUnidad={defaultUnidad} defaultPeriodo={defaultPeriodo} />}
      {subTab === 'rrhh' && <InformeGestion token={token} mode="rrhh" defaultUnidad={defaultUnidad} defaultPeriodo={defaultPeriodo} />}
      {subTab === 'consumos' && <ConsumosInventarios token={token} unidadNegocio={defaultUnidad!} periodo={defaultPeriodo!} />}
      {subTab === 'equipos' && <Equipos token={token} unidadNegocio={defaultUnidad!} periodo={defaultPeriodo!} />}
      {subTab === 'transportes' && <Transportes token={token} unidadNegocio={defaultUnidad!} periodo={defaultPeriodo!} />}
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
  const [view, setView] = useState<'proyectos' | 'dashboard' | 'dashboard_consolidado' | 'ingresos' | 'costos' | 'config'>('proyectos');
  const [globalUnidad, setGlobalUnidad] = useState<string | undefined>(undefined);
  const [globalPeriodo, setGlobalPeriodo] = useState<string | undefined>(undefined);
  const [showAbout, setShowAbout] = useState(false);

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
        <div className="max-w-[1800px] w-full mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <h1 className="font-bold text-slate-800 text-sm flex items-center gap-3">
              <img src="/logo_cee.png" alt="CEE" className="h-8 w-8 rounded-md object-contain" />
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span>Reporte de Resultados</span>
                {globalUnidad && globalPeriodo && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 shadow-sm animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Gestionando: {globalUnidad} ({globalPeriodo})
                  </span>
                )}
              </div>
            </h1>
            <nav className="flex gap-1">

              <button onClick={() => setView('proyectos')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'proyectos' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}>
                <span className="flex items-center gap-1.5"><FileText size={15} /> Resultados Gestión</span>
              </button>

              {(user?.rol === 'admin' || user?.rol === 'consulta_general') && (
                <button onClick={() => setView('dashboard_consolidado')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'dashboard_consolidado' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}>
                  <span className="flex items-center gap-1.5"><PieChart size={15} /> Dashboard Consolidado</span>
                </button>
              )}

              {globalUnidad && globalPeriodo && (
                <>
                  <button onClick={() => setView('dashboard')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}>
                    <span className="flex items-center gap-1.5"><LayoutDashboard size={15} /> Dashboard de Gestión</span>
                  </button>
                  <button onClick={() => setView('ingresos')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'ingresos' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}>
                    <span className="flex items-center gap-1.5"><TrendingUp size={15} /> Ingresos</span>
                  </button>
                  <button onClick={() => setView('costos')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'costos' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}>
                    <span className="flex items-center gap-1.5"><Wallet size={15} /> Costos</span>
                  </button>
                </>
              )}
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
            <button onClick={() => setShowAbout(true)} className="text-slate-400 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Acerca de..."><Info size={16} /></button>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Cerrar Sesión"><LogOut size={16} /></button>
          </div>
        </div>
      </div>

      {/* Content */}
      {view === 'proyectos' && (
        <GestorInformes 
          token={token} 
          user={user} 
          activeUnidad={globalUnidad} 
          activePeriodo={globalPeriodo} 
          onOpenReport={(u: string, p: string) => { 
            setGlobalUnidad(u); 
            setGlobalPeriodo(p); 
            setView('dashboard'); 
          }} 
        />
      )}
      {view === 'dashboard_consolidado' && <DashboardConsolidado token={token} defaultPeriodo={globalPeriodo} />}
      {view === 'dashboard' && <MainDashboard token={token} defaultUnidad={globalUnidad} defaultPeriodo={globalPeriodo} />}
      {view === 'ingresos' && <Ingresos token={token} onLogout={handleLogout} defaultUnidad={globalUnidad} defaultPeriodo={globalPeriodo} />}
      {view === 'costos' && <Costos token={token} defaultUnidad={globalUnidad} defaultPeriodo={globalPeriodo} />}
      {view === 'config' && user?.rol === 'admin' && <Configuracion token={token} />}

      {/* Modal Acerca de */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <img src="/logo_cee.png" alt="CEE" className="h-16 w-16 mx-auto rounded-xl object-contain shadow-sm border border-slate-100" />
              <div>
                <h3 className="text-xl font-bold text-slate-800">Reporte de Resultados</h3>
                <p className="text-slate-500 text-sm mt-1">Sistema Integrado de Gestión</p>
              </div>
              <div className="py-4 border-y border-slate-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Versión:</span>
                  <span className="font-semibold text-slate-800">{__APP_VERSION__} ({__COMMIT_HASH__})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Fecha de Generación:</span>
                  <span className="font-semibold text-slate-800">{__BUILD_DATE__}</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-center">
              <button onClick={() => setShowAbout(false)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors w-full">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface RespaldoItem {
  id: number;
  tipo_documento: string;
  unidad_negocio: string;
  periodo: string;
  nombre_archivo: string;
  tipo_mime: string;
  usuario_carga: string;
  fecha_carga: string;
}

function DocumentosRespaldo({
  token,
  tipoDocumento,
  unidadNegocio,
  periodo,
  reportClosed
}: {
  token: string;
  tipoDocumento: string;
  unidadNegocio: string;
  periodo: string;
  reportClosed: boolean;
}) {
  const [list, setList] = useState<RespaldoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const pStr = periodo.replace('/', '-');

  const fetchRespaldos = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/respaldos?tipo_documento=${encodeURIComponent(tipoDocumento)}&unidad_negocio=${encodeURIComponent(unidadNegocio)}&periodo=${encodeURIComponent(pStr)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar documentos de respaldo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (unidadNegocio && periodo) {
      fetchRespaldos();
    }
  }, [unidadNegocio, periodo, tipoDocumento]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo_documento', tipoDocumento);
    formData.append('unidad_negocio', unidadNegocio);
    formData.append('periodo', pStr);

    try {
      const res = await fetch(`/api/respaldos/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Error ${res.status}`);
      }
      setSuccess('Documento subido correctamente.');
      fetchRespaldos();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al subir documento');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDescargar = async (id: number, nombre: string) => {
    try {
      const res = await fetch(`/api/respaldos/descargar/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al descargar el archivo');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert('No se pudo descargar el archivo.');
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este documento de respaldo?')) return;
    setDeletingId(id);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/respaldos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSuccess('Documento eliminado.');
      setList(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      console.error(err);
      setError('Error al eliminar documento');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 max-w-[1800px] mx-auto mb-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Paperclip className="text-blue-600 h-5 w-5" />
          <h4 className="text-sm font-bold text-slate-800">Documentación de Respaldo</h4>
        </div>
        {!reportClosed && (
          <label className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 px-3 rounded-lg text-xs transition-colors cursor-pointer select-none border border-slate-200">
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
            Subir Documento
            <input type="file" onChange={handleUpload} disabled={uploading} className="hidden" />
          </label>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
          <Check size={14} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={18} className="text-blue-600 animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <p className="text-xs text-slate-400 italic text-center py-2">No hay documentos de respaldo adjuntos para este período.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map(item => (
            <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-slate-55 transition-colors">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Paperclip size={14} className="text-slate-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => handleDescargar(item.id, item.nombre_archivo)}
                    className="text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors truncate block text-left w-full hover:underline"
                    title={`Descargar ${item.nombre_archivo}`}
                  >
                    {item.nombre_archivo}
                  </button>
                  <span className="text-[9px] text-slate-400 block truncate">
                    Cargado por: {item.usuario_carga} • {item.fecha_carga.substring(0, 10)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => handleDescargar(item.id, item.nombre_archivo)}
                  className="text-slate-500 hover:text-blue-600 p-1 hover:bg-blue-50 rounded transition-colors"
                  title="Descargar"
                >
                  <Download size={13} />
                </button>
                {!reportClosed && (
                  <button
                    onClick={() => handleEliminar(item.id)}
                    disabled={deletingId === item.id}
                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Eliminar"
                  >
                    {deletingId === item.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
