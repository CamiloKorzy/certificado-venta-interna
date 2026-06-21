import React, { useEffect, useState, useMemo } from 'react';
import { Building2, UploadCloud, Trash2, Calendar, FileText, Check, AlertCircle, Loader2, Save, ArrowLeft, RefreshCw, Download, Info, Briefcase, Paperclip } from 'lucide-react';
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

interface ObraItemDetail {
  id?: number;
  item: string;
  descripcion: string;
  unidad_medida: string;
  cantidad_aprobada: number;
  precio_unitario: number;
  presente_certificado: number;
  anterior_certificado: number;
  total_certificado: number;
  faltante_certificar: number;
  parcial_presente: number;
  parcial_anterior: number;
  parcial_total: number;
  monto_aprobado: number;
  avance_usd: number;
}

interface ObraMaestro {
  id: number;
  numero_interno: number;
  comitente: string;
  contratista: string;
  obra: string;
  fecha_certificado: string;
  estado: 'BORRADOR' | 'CONFIRMADO';
  usuario_carga: string;
  fecha_carga: string;
  items: ObraItemDetail[];
}

export default function CertificadosObras({
  token,
  unidadNegocio,
  periodo
}: {
  token: string;
  unidadNegocio: string;
  periodo: string;
}) {
  const [sheets, setSheets] = useState<ObraMaestro[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [reportClosed, setReportClosed] = useState(false);

  const downloadTemplate = () => {
    const data = [
      ["Comitente:", "Empresa Cliente S.A."],
      ["Contratista:", "Seguridad Integral S.R.L."],
      ["Obra:", "Ampliación Planta Industrial - Sector B"],
      ["Fecha:", "21/06/2026"],
      [],
      [],
      [
        "Item",
        "Descripción / Tarea",
        "U.M.",
        "Cantidad Aprobada",
        "Precio Unitario",
        "Presente Certificado",
        "Anterior Certificado"
      ],
      [
        "1.1",
        "Instalación de faenas y limpieza de terreno",
        "gl",
        1,
        500000,
        1,
        0
      ],
      [
        "1.2",
        "Excavación y movimiento de suelos",
        "m3",
        1200,
        1200,
        300,
        600
      ],
      [
        "2.1",
        "Estructura de hormigón armado H21",
        "m3",
        250,
        18000,
        50,
        150
      ],
      [
        "2.2",
        "Mampostería de ladrillos huecos 18x18x33",
        "m2",
        1500,
        3500,
        400,
        800
      ],
      [
        "3.1",
        "Pintura exterior e interior al látex",
        "m2",
        3000,
        1200,
        1500,
        500
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wscols = [
      { wch: 10 },
      { wch: 45 },
      { wch: 8 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 }
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Certificado");
    XLSX.writeFile(wb, "Plantilla_Certificado_Obra.xlsx");
  };

  // Active sheet form state
  const [comitente, setComitente] = useState('');
  const [contratista, setContratista] = useState('');
  const [obra, setObra] = useState('');
  const [fechaCertificado, setFechaCertificado] = useState('');
  const [items, setItems] = useState<ObraItemDetail[]>([]);

  useEffect(() => {
    if (unidadNegocio && periodo) {
      fetchReportStateAndSheets();
    }
  }, [unidadNegocio, periodo]);

  const fetchReportStateAndSheets = async (selectId: number | null = null) => {
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

      // Fetch sheets
      const res = await apiFetch(`/api/certificados-obras?unidad_negocio=${encodeURIComponent(unidadNegocio)}&periodo=${encodeURIComponent(pStr)}`, token);
      const list: ObraMaestro[] = Array.isArray(res) ? res : [];
      setSheets(list);

      if (list.length > 0) {
        const toSelect = selectId !== null && list.some(s => s.id === selectId)
          ? list.find(s => s.id === selectId)!
          : list[0];
        
        setSelectedSheetId(toSelect.id);
        initForm(toSelect);
      } else {
        setSelectedSheetId(null);
        clearForm();
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Error al cargar certificados de obras');
    } finally {
      setLoading(false);
    }
  };

  const initForm = (sheet: ObraMaestro) => {
    setComitente(sheet.comitente || '');
    setContratista(sheet.contratista || '');
    setObra(sheet.obra || '');
    setFechaCertificado(sheet.fecha_certificado ? sheet.fecha_certificado.substring(0, 10) : '');
    setItems(sheet.items || []);
  };

  const clearForm = () => {
    setComitente('');
    setContratista('');
    setObra('');
    setFechaCertificado('');
    setItems([]);
  };

  // Find selected sheet
  const activeSheet = useMemo(() => {
    return sheets.find(s => s.id === selectedSheetId) || null;
  }, [sheets, selectedSheetId]);

  // Recalculate row values when numeric inputs change
  const handleItemChange = (index: number, field: keyof ObraItemDetail, val: string | number) => {
    setItems(prevItems => {
      const updated = [...prevItems];
      const row = { ...updated[index] };

      if (field === 'item' || field === 'descripcion' || field === 'unidad_medida') {
        row[field] = val as string;
      } else {
        const num = parseFloat(val as string) || 0;
        row[field] = num;

        // Auto calculations
        if (field === 'cantidad_aprobada' || field === 'precio_unitario' || field === 'presente_certificado' || field === 'anterior_certificado') {
          const cant_aprob = field === 'cantidad_aprobada' ? num : row.cantidad_aprobada;
          const precio_unit = field === 'precio_unitario' ? num : row.precio_unitario;
          const pres_cert = field === 'presente_certificado' ? num : row.presente_certificado;
          const ant_cert = field === 'anterior_certificado' ? num : row.anterior_certificado;

          row.total_certificado = pres_cert + ant_cert;
          row.faltante_certificar = cant_aprob - row.total_certificado;
          row.parcial_presente = pres_cert * precio_unit;
          row.parcial_anterior = ant_cert * precio_unit;
          row.parcial_total = row.total_certificado * precio_unit;
          row.monto_aprobado = cant_aprob * precio_unit;
        }
      }

      updated[index] = row;
      return updated;
    });
  };

  // Totals calculations for the footer
  const totals = useMemo(() => {
    return items.reduce((acc, row) => ({
      monto_aprobado: acc.monto_aprobado + (row.monto_aprobado || 0),
      parcial_presente: acc.parcial_presente + (row.parcial_presente || 0),
      parcial_anterior: acc.parcial_anterior + (row.parcial_anterior || 0),
      parcial_total: acc.parcial_total + (row.parcial_total || 0),
      avance_usd: acc.avance_usd + (row.avance_usd || 0),
    }), {
      monto_aprobado: 0,
      parcial_presente: 0,
      parcial_anterior: 0,
      parcial_total: 0,
      avance_usd: 0,
    });
  }, [items]);

  // Upload Excel
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
      const res = await fetch(`${API_URL}/api/certificados-obras/upload`, {
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
      setSuccessMsg(`Planilla importada como BORRADOR (Nro. Interno #${json.numero_interno}). Modifique los campos necesarios y confírmela.`);
      
      // Reload and select the newly uploaded maestro
      await fetchReportStateAndSheets(json.maestro_id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al subir certificado de obra');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Confirm changes (and save items)
  const handleConfirm = async () => {
    if (!selectedSheetId || reportClosed) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      await apiFetch(`/api/certificados-obras/${selectedSheetId}/confirm`, token, {
        method: 'PUT',
        body: JSON.stringify({
          comitente,
          contratista,
          obra,
          fecha_certificado: fechaCertificado || null,
          items: items
        })
      });

      setSuccessMsg('Certificado guardado y CONFIRMADO exitosamente.');
      await fetchReportStateAndSheets(selectedSheetId);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al confirmar certificado de obra');
    } finally {
      setSaving(false);
    }
  };

  // Delete maestro (cascading details)
  const handleDelete = async () => {
    if (!selectedSheetId || reportClosed) return;
    if (!window.confirm('¿Está seguro de que desea eliminar este certificado por completo?')) return;

    setDeleting(true);
    setError('');
    setSuccessMsg('');

    try {
      await apiFetch(`/api/certificados-obras/${selectedSheetId}`, token, {
        method: 'DELETE'
      });

      setSuccessMsg('Certificado eliminado correctamente.');
      await fetchReportStateAndSheets();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al eliminar el certificado');
    } finally {
      setDeleting(false);
    }
  };

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  // Format numbers
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
            <Building2 className="text-blue-600 h-6 w-6" />
            Certificados de Obras
          </h2>
          <p className="text-sm text-slate-500">
            Administra, visualiza e importa los certificados de obras para {unidadNegocio} en el período {periodo}.
          </p>
        </div>

        {/* Upload Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-xl text-sm border border-slate-200 transition-all shadow-sm"
          >
            <Download size={16} />
            Descargar Plantilla
          </button>

          {!reportClosed ? (
            <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-sm transition-all shadow-sm shadow-blue-500/10 cursor-pointer select-none">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
              Importar Certificado (Excel)
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
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

      {/* Main View Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Cargando certificados de obras...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Sidebar: List of Certificates */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Certificados del Período</h3>
            
            {sheets.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No hay certificados cargados. Suba un archivo Excel para comenzar.
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {sheets.map(sheet => (
                  <button
                    key={sheet.id}
                    onClick={() => {
                      setSelectedSheetId(sheet.id);
                      initForm(sheet);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                      selectedSheetId === sheet.id
                        ? 'border-blue-600 bg-blue-50/15 shadow-sm'
                        : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-slate-800 text-sm">
                        Certificado #{sheet.numero_interno}
                      </span>
                      {sheet.estado === 'BORRADOR' ? (
                        <span className="text-[10px] font-black uppercase bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-100">
                          BORRADOR
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100">
                          CONFIRMADO
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-slate-500 space-y-0.5">
                      <p className="truncate"><span className="font-semibold text-slate-600">Obra:</span> {sheet.obra || 'Sin nombre'}</p>
                      <p className="truncate"><span className="font-semibold text-slate-600">Contratista:</span> {sheet.contratista}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Cargado: {sheet.fecha_carga.substring(0, 10)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Editor Area */}
          {activeSheet ? (
            <div className="lg:col-span-3 space-y-6">
              {/* Sheet Metadata Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-slate-800">
                      Detalle del Certificado #{activeSheet.numero_interno}
                    </span>
                    {activeSheet.estado === 'BORRADOR' ? (
                      <span className="text-xs font-bold uppercase bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-lg border border-amber-100">
                        Borrador editable
                      </span>
                    ) : (
                      <span className="text-xs font-bold uppercase bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-lg border border-emerald-100">
                        Confirmado (Solo lectura)
                      </span>
                    )}
                  </div>
                  
                  {/* Delete Sheet Button */}
                  {!reportClosed && (
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl transition-all inline-flex items-center gap-1.5 text-xs font-bold border border-transparent hover:border-red-100 shadow-sm"
                      title="Eliminar este certificado por completo"
                    >
                      {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      Eliminar Certificado
                    </button>
                  )}
                </div>

                {/* Grid of inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Comitente</label>
                    <input
                      type="text"
                      value={comitente}
                      onChange={(e) => setComitente(e.target.value)}
                      disabled={activeSheet.estado === 'CONFIRMADO' || reportClosed}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Contratista</label>
                    <input
                      type="text"
                      value={contratista}
                      onChange={(e) => setContratista(e.target.value)}
                      disabled={activeSheet.estado === 'CONFIRMADO' || reportClosed}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Obra</label>
                    <input
                      type="text"
                      value={obra}
                      onChange={(e) => setObra(e.target.value)}
                      disabled={activeSheet.estado === 'CONFIRMADO' || reportClosed}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Fecha del Certificado</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Calendar size={14} />
                      </div>
                      <input
                        type="date"
                        value={fechaCertificado}
                        onChange={(e) => setFechaCertificado(e.target.value)}
                        disabled={activeSheet.estado === 'CONFIRMADO' || reportClosed}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Documentos de Respaldo */}
              <DocumentosRespaldo
                token={token}
                tipoDocumento="CERTIFICADO_OBRAS"
                unidadNegocio={unidadNegocio}
                periodo={periodo}
                reportClosed={reportClosed}
              />

              {/* Items Grid Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/80 sticky top-0 z-10 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-4 py-3 w-16">Item</th>
                        <th className="px-4 py-3 min-w-[200px]">Descripción / Tarea</th>
                        <th className="px-4 py-3 w-20">U.M.</th>
                        <th className="px-4 py-3 text-right w-28">Cant. Aprobada</th>
                        <th className="px-4 py-3 text-right w-28">Precio Unit.</th>
                        <th className="px-4 py-3 text-right w-28">Pres. Cert.</th>
                        <th className="px-4 py-3 text-right w-28">Ant. Cert.</th>
                        <th className="px-4 py-3 text-right w-28 font-bold text-slate-600">Total Cert.</th>
                        <th className="px-4 py-3 text-right w-28">Faltante</th>
                        <th className="px-4 py-3 text-right w-32">Parcial Pres.</th>
                        <th className="px-4 py-3 text-right w-32">Parcial Ant.</th>
                        <th className="px-4 py-3 text-right w-32 font-bold text-slate-700">Parcial Total</th>
                        <th className="px-4 py-3 text-right w-32">Monto Aprob.</th>
                        <th className="px-4 py-3 text-right w-24">Avance (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-600 text-sm">
                      {items.map((row, idx) => {
                        const isEditable = activeSheet.estado === 'BORRADOR' && !reportClosed;
                        return (
                          <tr key={idx} className="hover:bg-slate-55 transition-colors text-xs">
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={row.item}
                                onChange={(e) => handleItemChange(idx, 'item', e.target.value)}
                                disabled={!isEditable}
                                className="w-full p-1 border-0 bg-transparent focus:ring-1 focus:ring-blue-500 font-bold text-slate-800 disabled:opacity-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={row.descripcion}
                                onChange={(e) => handleItemChange(idx, 'descripcion', e.target.value)}
                                disabled={!isEditable}
                                className="w-full p-1 border-0 bg-transparent focus:ring-1 focus:ring-blue-500 font-semibold text-slate-700 disabled:opacity-100 truncate"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={row.unidad_medida}
                                onChange={(e) => handleItemChange(idx, 'unidad_medida', e.target.value)}
                                disabled={!isEditable}
                                className="w-full p-1 border-0 bg-transparent focus:ring-1 focus:ring-blue-500 text-slate-500 disabled:opacity-100 text-center"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="any"
                                value={row.cantidad_aprobada}
                                onChange={(e) => handleItemChange(idx, 'cantidad_aprobada', e.target.value)}
                                disabled={!isEditable}
                                className="w-full p-1 border-0 bg-transparent focus:ring-1 focus:ring-blue-500 text-right font-bold text-slate-700 disabled:opacity-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="any"
                                value={row.precio_unitario}
                                onChange={(e) => handleItemChange(idx, 'precio_unitario', e.target.value)}
                                disabled={!isEditable}
                                className="w-full p-1 border-0 bg-transparent focus:ring-1 focus:ring-blue-500 text-right text-slate-600 disabled:opacity-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="any"
                                value={row.presente_certificado}
                                onChange={(e) => handleItemChange(idx, 'presente_certificado', e.target.value)}
                                disabled={!isEditable}
                                className="w-full p-1 border-1 border-dashed border-blue-200 bg-blue-50/5 focus:bg-white focus:border-blue-500 text-right font-bold text-blue-600 disabled:border-0 disabled:bg-transparent disabled:opacity-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="any"
                                value={row.anterior_certificado}
                                onChange={(e) => handleItemChange(idx, 'anterior_certificado', e.target.value)}
                                disabled={!isEditable}
                                className="w-full p-1 border-1 border-dashed border-slate-200 bg-slate-50/10 focus:bg-white focus:border-blue-500 text-right text-slate-600 disabled:border-0 disabled:bg-transparent disabled:opacity-100"
                              />
                            </td>
                            {/* Read-only derived values */}
                            <td className="px-4 py-2 text-right font-bold text-slate-700 bg-slate-50/30">
                              {formatNumber(row.total_certificado)}
                            </td>
                            <td className="px-4 py-2 text-right font-medium text-slate-500 bg-slate-50/30">
                              {formatNumber(row.faltante_certificar)}
                            </td>
                            <td className="px-4 py-2 text-right text-slate-600">
                              {formatCurrency(row.parcial_presente)}
                            </td>
                            <td className="px-4 py-2 text-right text-slate-500">
                              {formatCurrency(row.parcial_anterior)}
                            </td>
                            <td className="px-4 py-2 text-right font-extrabold text-blue-600 bg-blue-50/15">
                              {formatCurrency(row.parcial_total)}
                            </td>
                            <td className="px-4 py-2 text-right font-bold text-slate-600 bg-slate-50/30">
                              {formatCurrency(row.monto_aprobado)}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="any"
                                value={row.avance_usd}
                                onChange={(e) => handleItemChange(idx, 'avance_usd', e.target.value)}
                                disabled={!isEditable}
                                className="w-full p-1 border-0 bg-transparent focus:ring-1 focus:ring-blue-500 text-right text-slate-500 disabled:opacity-100"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer totals */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200/80 flex flex-wrap gap-x-8 gap-y-2 items-center justify-between text-xs font-bold text-slate-500 tracking-wider sticky bottom-0 z-10">
                  <div className="flex flex-wrap gap-x-8 gap-y-2">
                    <span>APROBADO: <span className="text-slate-700 font-extrabold">{formatCurrency(totals.monto_aprobado)}</span></span>
                    <span>PRESENTE: <span className="text-blue-600 font-extrabold">{formatCurrency(totals.parcial_presente)}</span></span>
                    <span>ANTERIOR: <span className="text-slate-600 font-extrabold">{formatCurrency(totals.parcial_anterior)}</span></span>
                  </div>
                  <span className="text-slate-800 font-extrabold text-sm">
                    PARCIAL TOTAL: {formatCurrency(totals.parcial_total)}
                  </span>
                </div>
              </div>

              {/* Action buttons for Borrador */}
              {activeSheet.estado === 'BORRADOR' && !reportClosed && (
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={handleConfirm}
                    disabled={saving}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-sm shadow-emerald-500/10"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Confirmar y Guardar Certificado
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="lg:col-span-3 space-y-6">
              {/* Introduction Card */}
              <div className="bg-gradient-to-br from-white to-blue-50/10 border border-slate-200/80 rounded-2xl p-8 shadow-sm space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shrink-0">
                    <FileText size={28} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-800">Importación y Carga Inteligente de Certificados</h3>
                    <p className="text-sm text-slate-500 max-w-2xl leading-relaxed font-medium">
                      El sistema interpreta automáticamente sus planillas de obras. No es necesario estructurar fórmulas complejas en el Excel; la plataforma mapea las columnas y calcula los avances y totales de forma inteligente.
                    </p>
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Column 1: Estructura */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Info size={14} className="text-blue-500" />
                      1. Cabecera y Metadatos (Filas 1 a 15)
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      El importador escanea las primeras 15 filas buscando las siguientes etiquetas. El valor ubicado en la celda contigua (a la derecha) será extraído automáticamente:
                    </p>
                    <ul className="space-y-2 text-xs text-slate-600 font-semibold pl-1">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <span><code className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Comitente:</code> Nombre del cliente</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <span><code className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Contratista:</code> Nombre de la constructora</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <span><code className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Obra:</code> Identificador de la obra</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <span><code className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Fecha:</code> Fecha del certificado (ej. YYYY-MM-DD o DD/MM/YYYY)</span>
                      </li>
                    </ul>
                  </div>

                  {/* Column 2: Mapeo e Interpretacion */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Check size={14} className="text-emerald-500" />
                      2. Mapeo Automático de Columnas
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      El sistema busca una fila que contenga columnas clave. No importa el orden exacto ni las palabras idénticas; se realiza una búsqueda semántica de aproximación:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 font-bold block mb-0.5">Columna Requerida</span>
                        <span className="text-slate-700">Item</span>
                        <span className="text-slate-700 block mt-1">Descripción / Tarea</span>
                        <span className="text-slate-700 block mt-1">U.M. (Unidad de Medida)</span>
                        <span className="text-slate-700 block mt-1">Cantidad Aprobada</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block mb-0.5">Términos que Coinciden</span>
                        <span className="text-blue-600">"item"</span>
                        <span className="text-blue-600 block mt-1">"descrip", "tarea", "trabajo"</span>
                        <span className="text-blue-600 block mt-1">"unidad", "u.m"</span>
                        <span className="text-blue-600 block mt-1">"aprobada", "cantidad aprob"</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Calculos inteligentes */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                      Cálculos y Fórmulas Automáticas
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      No es necesario incluir las columnas de importes o parciales calculados. El sistema recalcula en tiempo real al importar:
                    </p>
                    <div className="text-[11px] text-slate-600 bg-indigo-50/15 border border-indigo-100/50 p-3 rounded-xl space-y-1.5 font-medium">
                      <p><span className="font-bold text-slate-700">Total Certificado:</span> Cantidad Presente + Cantidad Anterior</p>
                      <p><span className="font-bold text-slate-700">Faltante a Certificar:</span> Cantidad Aprobada - Total Certificado</p>
                      <p><span className="font-bold text-slate-700">Monto Parcial Presente:</span> Cantidad Presente × Precio Unitario</p>
                      <p><span className="font-bold text-slate-700">Porcentaje de Avance:</span> Total Certificado ÷ Cantidad Aprobada × 100</p>
                    </div>
                  </div>

                  {/* Accion rapida */}
                  <div className="bg-slate-55 border border-slate-200/50 p-6 rounded-2xl flex flex-col justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800">¿Listo para comenzar?</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        Descargue la plantilla prediseñada para asegurar que la estructura cumpla con el formato óptimo del importador.
                      </p>
                    </div>
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all shadow-md shadow-blue-500/10"
                    >
                      <Download size={14} />
                      Descargar Plantilla Excel de Ejemplo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
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

