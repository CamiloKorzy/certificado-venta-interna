import React, { useEffect, useState, useMemo } from 'react';
import { Building2, UploadCloud, Trash2, Calendar, FileText, Check, AlertCircle, Loader2, Save, ArrowLeft, RefreshCw } from 'lucide-react';

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
            <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 space-y-2 shadow-sm">
              <FileText size={48} className="mx-auto text-slate-300" />
              <h3 className="font-bold text-slate-600 text-base">Ningún certificado seleccionado</h3>
              <p className="text-sm max-w-sm mx-auto">
                Seleccione un certificado en la lista lateral, o suba uno nuevo en el botón superior.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
