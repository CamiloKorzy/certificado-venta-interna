import React, { useState, useEffect } from 'react';
import { MultiSelect } from './MultiSelect';
import { Download, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

const getDefaultPeriod = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${yyyy}`;
};

export default function InformeGestion({ token, defaultUnidad = 'Seguridad de Activos', defaultPeriodo = getDefaultPeriod(), mode = 'dashboard' }: { token: string, defaultUnidad?: string, defaultPeriodo?: string, mode?: 'dashboard' | 'gastos' | 'asientos' | 'rrhh' }) {
  const [data, setData] = useState<any>(null);
  const [asientosData, setAsientosData] = useState<any>(null);
  const [rrhhData, setRrhhData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [unidad, setUnidad] = useState(defaultUnidad);
  const [periodoStr, setPeriodoStr] = useState(defaultPeriodo);
  
  const [unidades, setUnidades] = useState<any[]>([]);
  const [searchTermRRHH, setSearchTermRRHH] = useState('');

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
        const res = await fetch('/api/mis-unidades', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
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
      if (mode === 'asientos') {
        const [year, month] = p.split('-');
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const fecha_desde = `${p}-01`;
        const fecha_hasta = `${p}-${lastDay}`;
        const res = await fetch(`/api/asientos?empresa=${encodeURIComponent(unidad)}&fecha_desde=${encodeURIComponent(fecha_desde)}&fecha_hasta=${encodeURIComponent(fecha_hasta)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Error al obtener asientos");
        setAsientosData(await res.json());
      } else if (mode === 'rrhh') {
        const res = await fetch(`/api/rrhh?empresa=${encodeURIComponent(unidad)}&periodo=${encodeURIComponent(p)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Error al obtener RRHH");
        setRrhhData(await res.json());
      } else {
        const res = await fetch(`/api/informes/mensual?unidad_negocio=${encodeURIComponent(unidad)}&periodo=${encodeURIComponent(p)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
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

  const handlePresentar = async () => {
    const p = parsePeriodo(periodoStr);
    try {
      const res = await fetch(`/api/cierre/presentar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          unidad_negocio: unidad,
          periodo: p
        })
      });
      if (!res.ok) {
         const j = await res.json();
         throw new Error(j.detail || "Error al presentar periodo");
      }
      alert("Periodo presentado correctamente");
      loadInforme();
    } catch(e: any) {
      alert(e.message);
    }
  };

  const handleReabrir = async () => {
    if (!window.confirm("¿Seguro que deseas reabrir el periodo?")) return;
    const p = parsePeriodo(periodoStr);
    try {
      const res = await fetch(`/api/cierre/reabrir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          unidad_negocio: unidad,
          periodo: p
        })
      });
      if (!res.ok) {
         const j = await res.json();
         throw new Error(j.detail || "Error al reabrir periodo");
      }
      alert("Periodo reabierto correctamente");
      loadInforme();
    } catch(e: any) {
      alert(e.message);
    }
  };

  const exportRRHHToxlsx = () => {
    if (!rrhhData || !rrhhData.legajos) return;
    const ws = XLSX.utils.json_to_sheet(rrhhData.legajos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RRHH");
    XLSX.writeFile(wb, `RRHH_${unidad}_${periodoStr.replace('/', '-')}.xlsx`);
  };

  const resultado = data ? data.totales.ingresos - data.totales.gastos : 0;

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      
      {/* Controles */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible p-6 mb-8 flex flex-col md:flex-row gap-4 items-start md:items-end">
        <div className="w-full md:w-64 relative">
            <MultiSelect 
              label="Unidad de Negocio" 
              options={unidades.map(u => u.nombre)} 
              selected={[unidad]} 
              onChange={v => setUnidad(v[0])} 
              singleSelection={true}
            />
        </div>
        <div className="w-full md:w-64">
            <MultiSelect 
              label="Periodo" 
              options={['06/2026', '05/2026', '04/2026', '03/2026', '02/2026', '01/2026', '12/2025', '11/2025', '10/2025']} 
              selected={[periodoStr]} 
              onChange={v => setPeriodoStr(v[0])} 
              singleSelection={true}
            />
        </div>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-800 rounded mb-6">{error}</div>}
      {loading && <div className="p-4 text-gray-500 mb-6">Cargando informe de gestión...</div>}
      
      {!loading && (data || asientosData || rrhhData) && (
        <div className="bg-white p-6 shadow-md rounded-lg space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold">
                {mode === 'gastos' ? 'Detalle de Gastos' : 
                 mode === 'asientos' ? 'Asientos Vinculados' : 
                 mode === 'rrhh' ? 'Recursos Humanos' : 'Dashboard Analítico'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              {data && (
                <>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${data.estado_cierre === 'CERRADO' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    Estado: {data.estado_cierre}
                  </span>
                  {data.estado_cierre === 'CERRADO' && data.usuario_cierre && (
                    <div className="text-sm text-gray-500 text-right">
                      Cerrado por: {data.usuario_cierre}<br/>
                      el: {new Date(data.fecha_cierre).toLocaleString()}
                    </div>
                  )}
                  {data.estado_cierre === 'ABIERTO' && (
                    <button onClick={handlePresentar} className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition">
                      Presentar Período
                    </button>
                  )}
                  {data.estado_cierre === 'CERRADO' && (
                    <button onClick={handleReabrir} className="px-4 py-2 border border-red-600 text-red-600 rounded shadow hover:bg-red-50 transition">
                      Reabrir (Solo Admin)
                    </button>
                  )}
                </>
              )}
              {mode === 'rrhh' && (
                <button onClick={exportRRHHToxlsx} className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition flex items-center gap-2">
                  <Download size={16} /> Exportar XLSX
                </button>
              )}
            </div>
          </div>
          {mode === 'dashboard' && data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-green-50 rounded shadow border-l-4 border-green-500">
                <h3 className="text-gray-500 text-sm uppercase tracking-wider">Total Ingresos</h3>
                <p className="text-2xl font-bold text-green-700">$ {data.totales.ingresos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-4 bg-red-50 rounded shadow border-l-4 border-red-500">
                <h3 className="text-gray-500 text-sm uppercase tracking-wider">Total Gastos</h3>
                <p className="text-2xl font-bold text-red-700">$ {data.totales.gastos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className={`p-4 rounded shadow border-l-4 ${resultado >= 0 ? 'bg-blue-50 border-blue-500' : 'bg-orange-50 border-orange-500'}`}>
                <h3 className="text-gray-500 text-sm uppercase tracking-wider">Resultado Neto</h3>
                <p className={`text-2xl font-bold ${resultado >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>$ {resultado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          )}

          {mode === 'gastos' && data && (
            <div className="space-y-6 mt-8">
              <div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border">
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
                <table className="min-w-full divide-y divide-gray-200 border">
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
                <table className="min-w-full divide-y divide-gray-200 border">
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
    </div>
  );
}
