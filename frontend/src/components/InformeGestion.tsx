import React, { useState, useEffect, useCallback } from 'react';
import { Download, Search, UploadCloud, Loader2, Settings, X, Trash2, AlertCircle, FileText, Info, Building2, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';

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

export default function InformeGestion({ token, defaultUnidad = 'Seguridad de Activos', defaultPeriodo = getDefaultPeriod(), mode = 'dashboard' }: { token: string, defaultUnidad?: string, defaultPeriodo?: string, mode?: 'dashboard' | 'costos' | 'asientos' | 'rrhh' }) {
  const user = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('cert_user') || 'null');
    } catch {
      return null;
    }
  }, []);

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

  const [data, setData] = useState<any>(null);
  const [asientosData, setAsientosData] = useState<any>(null);
  const [rrhhData, setRrhhData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [selectedAjustes, setSelectedAjustes] = useState<Set<number>>(new Set());
  
  const handleSelectAjuste = (id: number) => {
    const newSet = new Set(selectedAjustes);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedAjustes(newSet);
  };
  
  const handleSelectAllAjustes = () => {
    const ajustes = data.gastos.filter((c: any) => c.origen === 'AJUSTE EXCEL' && c.id_ajuste);
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
      await authFetch('/api/config/ajustes-excel/bulk', token, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedAjustes) })
      });
      setSelectedAjustes(new Set());
      loadInforme();
    } catch (e) {
      console.error(e);
      await showAlert('Error eliminando ajustes');
    } finally {
      setUploading(false);
    }
  };

  const [uploadMsg, setUploadMsg] = useState('');

  
  const downloadTemplate = (tipo: string) => {
    const ws_data = [
      ['Fecha', 'Comprobante', 'Concepto', 'Importe'],
      ['04/05/2026', 'A-0002-0002343', 'Gastos adicionales', 1500.50]
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wscols = [{wch:15}, {wch:20}, {wch:35}, {wch:15}];
    ws['!cols'] = wscols;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Ajustes");
    XLSX.writeFile(wb, `Plantilla_${tipo === 'COSTO' ? 'Costos' : 'Ingresos'}.xlsx`);
  };

  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [uploadTipo, setUploadTipo] = useState<'INGRESO' | 'COSTO'>('COSTO');

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
    formData.append("unidad", unidad);
    formData.append("periodo", periodoStr);
    formData.append("tipo", uploadTipo);

    try {
      const res = await authFetch('/api/config/ajustes-excel', token, {
        method: 'POST',
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
        loadInforme(); // recargar
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

  const [error, setError] = useState('');
  
  const [unidad, setUnidad] = useState(defaultUnidad);
  const [periodoStr, setPeriodoStr] = useState(defaultPeriodo);
  
  const [unidades, setUnidades] = useState<any[]>([]);
  const [searchTermRRHH, setSearchTermRRHH] = useState('');
  const [estadoCierre, setEstadoCierre] = useState<any>(null);

  const [showAjustesModal, setShowAjustesModal] = useState(false);
  const [ajustesList, setAjustesList] = useState<any[]>([]);
  const [loadingAjustes, setLoadingAjustes] = useState(false);

  const fetchAjustes = useCallback(async () => {
    setLoadingAjustes(true);
    try {
      const res = await authFetch('/api/config/ajustes-excel', token);
      if (res.ok) {
        const json = await res.json();
        const filtered = (json || []).filter((a: any) => 
           a.tipo_movimiento === 'COSTO' &&
           a.unidad_negocio === unidad &&
           a.periodo === periodoStr
        );
        setAjustesList(filtered);
      }
    } catch(err) {
      console.error(err);
    }
    setLoadingAjustes(false);
  }, [unidad, periodoStr, token]);

  useEffect(() => {
    if (showAjustesModal) {
      fetchAjustes();
    }
  }, [showAjustesModal, fetchAjustes]);

  const handleDeleteAjuste = async (id: number) => {
    const confirmed = await showConfirm("¿Estás seguro de eliminar este registro importado? Esto modificará los indicadores.");
    if (!confirmed) return;
    try {
      const res = await authFetch(`/api/config/ajustes-excel/${id}`, token, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error("Error en servidor");
      fetchAjustes();
      loadInforme();
    } catch(err: any) {
      await showAlert("Error al eliminar: " + err.message);
    }
  };
  useEffect(() => {
    if (defaultUnidad) {
      setUnidad(defaultUnidad);
    }
  }, [defaultUnidad]);

  useEffect(() => {
    if (defaultPeriodo) {
      setPeriodoStr(defaultPeriodo);
    }
  }, [defaultPeriodo]);

  // Format of periodo: MM/YYYY -> YYYY-MM
  const parsePeriodo = (p: string) => {
    if (!p || p === 'Desconocido' || !p.includes('/')) return null;
    const parts = p.split('/');
    if (parts.length === 2) {
      return `${parts[1]}-${parts[0].padStart(2, '0')}`;
    }
    return null;
  };

  useEffect(() => {
    const fetchUnidades = async () => {
      try {
        const res = await authFetch('/api/mis-unidades', token);
        if (res.ok) {
          const json = await res.json();
          setUnidades(json);
          // Auto-select first if none selected
          if (!unidad && json.length > 0) {
            setUnidad(json[0].nombre);
          }
        }
      } catch (e) {}
    };
    fetchUnidades();
  }, [token]);

  const loadInforme = async () => {
    const p = parsePeriodo(periodoStr);
    if (!p) {
       setError("Seleccione un periodo válido (MM/YYYY).");
       return;
    }
    if (!unidad || unidad === 'General') {
       setError("Seleccione una Unidad de Negocio específica.");
       return;
    }


    setLoading(true);
    setError('');
    try {
      const pStr = parsePeriodo(periodoStr);
      const estadoRes = await authFetch(`/api/informes/estado?unidad_negocio=${encodeURIComponent(unidad)}&periodo=${encodeURIComponent(pStr!)}`, token);
      if (estadoRes.ok) {
        const estadoJson = await estadoRes.json();
        setEstadoCierre(estadoJson);
      }

      if (mode === 'asientos') {
        const [year, month] = p.split('-');
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const fecha_desde = `${p}-01`;
        const fecha_hasta = `${p}-${lastDay}`;
        const res = await authFetch(`/api/asientos?empresa=${encodeURIComponent(unidad)}&fecha_desde=${encodeURIComponent(fecha_desde)}&fecha_hasta=${encodeURIComponent(fecha_hasta)}`, token);
        if (!res.ok) throw new Error("Error al obtener asientos");
        setAsientosData(await res.json());
      } else if (mode === 'rrhh') {
        const res = await authFetch(`/api/rrhh?empresa=${encodeURIComponent(unidad)}&periodo=${encodeURIComponent(p)}`, token);
        if (!res.ok) throw new Error("Error al obtener RRHH");
        setRrhhData(await res.json());
      } else {
        const res = await authFetch(`/api/informes/mensual?unidad_negocio=${encodeURIComponent(unidad)}&periodo=${encodeURIComponent(p)}`, token);
        if (!res.ok) throw new Error("Error al obtener informe");
        const json = await res.json();
        setData(json);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInforme();
  }, [unidad, periodoStr, token]);



  const exportRRHHToxlsx = () => {
    if (!rrhhData || !rrhhData.legajos) return;
    const ws = XLSX.utils.json_to_sheet(rrhhData.legajos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RRHH");
    XLSX.writeFile(wb, `RRHH_${unidad}_${periodoStr.replace('/', '-')}.xlsx`);
  };

  const exportIngresosToxlsx = () => {
    if (!data || !data.ingresos) return;
    const ws = XLSX.utils.json_to_sheet(data.ingresos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ingresos");
    XLSX.writeFile(wb, `Ingresos_${unidad}_${periodoStr.replace('/', '-')}.xlsx`);
  };

  const exportCostosToxlsx = () => {
    if (!data || !data.gastos) return;
    const ws = XLSX.utils.json_to_sheet(data.gastos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Costos");
    XLSX.writeFile(wb, `Costos_${unidad}_${periodoStr.replace('/', '-')}.xlsx`);
  };

  const agrupadoPorRubro = (items: any[]) => {
    const agrupado: Record<string, number> = {};
    if (!items) return [];
    items.forEach(i => {
      const rubro = i.categoria || 'Sin Categoría';
      agrupado[rubro] = (agrupado[rubro] || 0) + (i.importe || 0);
    });
    return Object.entries(agrupado).map(([rubro, total]) => ({ rubro, total })).sort((a, b) => b.total - a.total);
  };

  const ingresosPorRubro = data ? agrupadoPorRubro(data.ingresos) : [];
  const gastosPorRubro = data ? agrupadoPorRubro(data.gastos) : [];

  const resultado = data ? data.totales.ingresos - data.totales.gastos : 0;

  return (
    <div className="p-6 max-w-[1800px] w-full mx-auto">
      
      {/* Active Project Information Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-8 flex flex-wrap gap-6 items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-slate-600">
            <Building2 className="text-blue-600 shrink-0" size={18} />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Sucursal:</span>
            <span className="text-sm font-bold text-slate-800">{unidad || defaultUnidad}</span>
          </div>
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="text-blue-600 shrink-0" size={18} />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Período:</span>
            <span className="text-sm font-bold text-slate-800">{periodoStr || defaultPeriodo}</span>
          </div>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Selección administrada desde la solapa Resultados Gestión
        </div>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-800 rounded mb-6">{error}</div>}
      {loading && <div className="p-4 text-gray-500 mb-6">Cargando informe de gestión...</div>}
      
      {!loading && (data || asientosData || rrhhData) && (
        <div className="bg-white p-6 shadow-md rounded-lg space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold">
                {mode === 'costos' ? 'Detalle de Costos' : 
                 mode === 'asientos' ? 'Asientos Vinculados' : 
                 mode === 'rrhh' ? 'Recursos Humanos' : 'Dashboard Analítico'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              {estadoCierre && (
                <>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${estadoCierre?.estado === 'CERRADO' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    Estado: {estadoCierre?.estado}
                  </span>
                  {estadoCierre?.estado === 'CERRADO' && estadoCierre?.usuario_cierre && (
                    <div className="text-sm text-gray-500 text-right">
                      Cerrado por: {estadoCierre?.usuario_cierre}<br/>
                      el: {new Date(estadoCierre?.fecha_cierre).toLocaleString()}
                    </div>
                  )}

                </>
              )}
              {mode === 'rrhh' && (
                <button onClick={exportRRHHToxlsx} className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm">
                  <Download size={14} /> Exportar XLSX
                </button>
              )}
              {mode === 'costos' && (
                <div className="flex items-center gap-3">

                  
                  {selectedAjustes.size > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      className="flex items-center gap-1.5 bg-red-55 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
                    >
                      <Trash2 size={14} />
                      Eliminar seleccionados ({selectedAjustes.size})
                    </button>
                  )}
                  <button
                    onClick={() => downloadTemplate('COSTO')}
                    className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
                  >
                    <Download size={14} />
                    Descargar Plantilla
                  </button>

                  <div className="relative">
                    <input type="file" id="upload-costos" className="hidden" accept=".xlsx,.xls" onChange={(e) => handleFileSelect(e, 'COSTO')} />
                    <label htmlFor="upload-costos" className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer border border-emerald-600">
                      {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                      Importar adicionales de Costos
                    </label>
                    {uploadMsg && <span className="absolute top-full mt-1 right-0 text-xs font-medium bg-white px-2 py-1 shadow-sm rounded text-slate-700 whitespace-nowrap z-50">{uploadMsg}</span>}
                  </div>
                  <button
                    onClick={() => setShowAjustesModal(true)}
                    className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
                  >
                    <Settings size={14} />
                    Importaciones Adicionales
                  </button>
                  <button 
                    onClick={exportCostosToxlsx} 
                    className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
                  >
                    <Download size={14} /> Exportar a Excel
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {showAjustesModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Settings size={18} className="text-emerald-600" />
                    Importaciones Adicionales (Costos)
                  </h3>
                  <button onClick={() => setShowAjustesModal(false)} className="text-slate-400 hover:text-slate-600">
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
                              <button onClick={() => handleDeleteAjuste(a.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors" title="Eliminar">
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
                    className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
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
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmImport}
                    disabled={!!previewError || previewRows.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-5 rounded-lg text-sm transition-all shadow-sm flex items-center gap-1.5"
                  >
                    Confirmar Importación
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {mode === 'dashboard' && data && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-green-50 rounded shadow border-l-4 border-green-500 flex flex-col justify-between">
                  <div>
                    <h3 className="text-gray-500 text-sm uppercase tracking-wider">Total Ingresos</h3>
                    <p className="text-2xl font-bold text-green-700 mt-1">$ {data.totales.ingresos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded shadow border-l-4 border-red-500 flex flex-col justify-between">
                  <div>
                    <h3 className="text-gray-500 text-sm uppercase tracking-wider">Total Costos</h3>
                    <p className="text-2xl font-bold text-red-700 mt-1">$ {data.totales.gastos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <div className={`p-4 rounded shadow border-l-4 ${resultado >= 0 ? 'bg-blue-50 border-blue-500' : 'bg-orange-50 border-orange-500'} flex flex-col justify-between`}>
                  <div>
                    <h3 className="text-gray-500 text-sm uppercase tracking-wider">Resultado Neto</h3>
                    <p className={`text-2xl font-bold mt-1 ${resultado >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>$ {resultado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-white rounded shadow border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-700">Ingresos por Rubro</h3>
                  </div>
                  <div className="p-4">
                    {ingresosPorRubro.length > 0 ? (
                      <ul className="space-y-3">
                        {ingresosPorRubro.map((r, idx) => (
                          <li key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 truncate mr-2" title={r.rubro}>{r.rubro}</span>
                            <span className="font-medium text-green-700 whitespace-nowrap">$ {r.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">No hay ingresos registrados en este periodo.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded shadow border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-700">Costos por Rubro</h3>
                  </div>
                  <div className="p-4">
                    {gastosPorRubro.length > 0 ? (
                      <ul className="space-y-3">
                        {gastosPorRubro.map((r, idx) => (
                          <li key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 truncate mr-2" title={r.rubro}>{r.rubro}</span>
                            <span className="font-medium text-red-700 whitespace-nowrap">$ {r.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">No hay costos registrados en este periodo.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === 'costos' && data && (
            <div className="space-y-6 mt-8">
              <div className="flex justify-between items-center bg-red-50 p-4 rounded shadow border-l-4 border-red-500 mb-6">
                 <div>
                   <h3 className="text-gray-500 text-sm uppercase tracking-wider">Total Costos</h3>
                   <p className="text-2xl font-bold text-red-700 mt-1">$ {data.totales.gastos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                 </div>
              </div>
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] divide-y divide-gray-200 border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Comprobante</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Importe</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.gastos.map((i: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm">{i.fecha?.substring(0, 10)}</td>
                          <td className="px-4 py-2 text-sm">{i.concepto}</td>
                          <td className="px-4 py-2 text-sm">{i.comprobante}</td>
                          <td className="px-4 py-2 text-sm">{i.proveedor || '-'}</td>
                          <td className="px-4 py-2 text-sm text-right text-red-700">$ {i.importe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                      {data.gastos.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-500">No hay gastos en este periodo</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {mode === 'asientos' && asientosData && (
            <div className="space-y-6 mt-8">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] divide-y divide-gray-200 border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cuenta</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {asientosData.map((a: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{a.fecha?.substring(0, 10)}</td>
                        <td className="px-4 py-2 text-sm">{a.cuenta_codigo} - {a.cuenta_nombre}</td>
                        <td className="px-4 py-2 text-sm">{a.descripcion || '-'}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium">$ {a.importe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    {asientosData.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500">No hay asientos configurados para este periodo</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mode === 'rrhh' && rrhhData && (
            <div className="space-y-6 mt-8">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                <div className="p-4 bg-white rounded shadow border-l-4 border-blue-500">
                  <h3 className="text-gray-500 text-xs uppercase tracking-wider">Costo Empresa</h3>
                  <p className="text-xl font-bold text-blue-700">$ {rrhhData.totales.costo_empresa.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 bg-white rounded shadow border-l-4 border-slate-500">
                  <h3 className="text-gray-500 text-xs uppercase tracking-wider">Neto</h3>
                  <p className="text-lg font-bold text-slate-700">$ {rrhhData.totales.neto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 bg-white rounded shadow border-l-4 border-green-500">
                  <h3 className="text-gray-500 text-xs uppercase tracking-wider">Remunerativo</h3>
                  <p className="text-lg font-bold text-green-700">$ {rrhhData.totales.remunerativo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 bg-white rounded shadow border-l-4 border-teal-500">
                  <h3 className="text-gray-500 text-xs uppercase tracking-wider">No Remunerativo</h3>
                  <p className="text-lg font-bold text-teal-700">$ {rrhhData.totales.no_remunerativo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 bg-white rounded shadow border-l-4 border-orange-500">
                  <h3 className="text-gray-500 text-xs uppercase tracking-wider">Contribuciones</h3>
                  <p className="text-lg font-bold text-orange-700">$ {rrhhData.totales.contribuciones.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 bg-white rounded shadow border-l-4 border-purple-500">
                  <h3 className="text-gray-500 text-xs uppercase tracking-wider">SAC Prorrat.</h3>
                  <p className="text-lg font-bold text-purple-700">$ {rrhhData.totales.sac_prorrateado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Detalle de Legajos</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por legajo o nombre..."
                    value={searchTermRRHH}
                    onChange={e => setSearchTermRRHH(e.target.value)}
                    className="pl-9 pr-4 py-2 border rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] divide-y divide-gray-200 border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Legajo</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Centro Costo</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Costo Empresa</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Neto</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Remunerativo</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">No Remun.</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Contrib.</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">SAC Prorrat.</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Retenc.</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rrhhData.legajos.filter((l: any) => {
                      if (!searchTermRRHH) return true;
                      const s = searchTermRRHH.toLowerCase();
                      return (l.legajo && String(l.legajo).toLowerCase().includes(s)) ||
                             (l.apellidonombre && String(l.apellidonombre).toLowerCase().includes(s));
                    }).map((l: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium">{l.legajo}</td>
                        <td className="px-4 py-2 text-sm">{l.apellidonombre}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{l.centrocosto}</td>
                        <td className="px-4 py-2 text-sm text-right font-bold text-blue-700">$ {l.costo_empresa.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-2 text-sm text-right text-slate-700">$ {l.neto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-2 text-sm text-right">$ {l.remunerativo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-2 text-sm text-right">$ {l.no_remunerativo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-2 text-sm text-right">$ {l.contribuciones.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-2 text-sm text-right text-purple-700">$ {l.sac_prorrateado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-2 text-sm text-right">$ {l.retenciones.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    {rrhhData.legajos.length === 0 && (
                      <tr><td colSpan={10} className="px-4 py-4 text-center text-gray-500">No hay datos de RRHH para este periodo</td></tr>
                    )}
                    {rrhhData.legajos.length > 0 && rrhhData.legajos.filter((l: any) => {
                      if (!searchTermRRHH) return true;
                      const s = searchTermRRHH.toLowerCase();
                      return (l.legajo && String(l.legajo).toLowerCase().includes(s)) ||
                             (l.apellidonombre && String(l.apellidonombre).toLowerCase().includes(s));
                    }).length === 0 && (
                      <tr><td colSpan={10} className="px-4 py-4 text-center text-gray-500">No se encontraron legajos que coincidan con la búsqueda</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      {renderCustomDialog()}
    </div>
  );
}
