import React, { useState, useEffect } from 'react';

export default function InformeGestion({ token, defaultUnidad = 'Seguridad de Activos', defaultPeriodo = '04/2026' }: { token: string, defaultUnidad?: string, defaultPeriodo?: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [unidad, setUnidad] = useState(defaultUnidad);
  const [periodoStr, setPeriodoStr] = useState(defaultPeriodo);
  
  const [unidades, setUnidades] = useState<any[]>([]);

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
      const res = await fetch(`/api/informes/mensual?unidad_negocio=${encodeURIComponent(unidad)}&periodo=${encodeURIComponent(p)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error al obtener informe");
      const json = await res.json();
      setData(json);
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

  const resultado = data ? data.totales.ingresos - data.totales.gastos : 0;

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      
      {/* Controles */}
      <div className="bg-white p-4 shadow rounded-lg mb-6 flex gap-4 items-end">
        <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unidad de Negocio</label>
            <select className="w-full border-gray-300 rounded p-2" value={unidad} onChange={e => setUnidad(e.target.value)}>
                <option value="">Seleccione...</option>
                {unidades.map(u => (
                    <option key={u.id} value={u.nombre}>{u.nombre}</option>
                ))}
            </select>
        </div>
        <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Periodo (MM/YYYY)</label>
            <input type="text" className="w-full border-gray-300 rounded p-2" value={periodoStr} onChange={e => setPeriodoStr(e.target.value)} placeholder="04/2026"/>
        </div>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-800 rounded mb-6">{error}</div>}
      {loading && <div className="p-4 text-gray-500 mb-6">Cargando informe de gestión...</div>}
      
      {!loading && data && (
        <div className="bg-white p-6 shadow-md rounded-lg space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold">Informe de Gestión</h2>
            </div>
            <div className="flex items-center space-x-4">
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
            </div>
          </div>

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

          <div className="space-y-6 mt-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Detalle de Ingresos</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Origen</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Comprobante</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.ingresos.map((i: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{i.origen}</td>
                        <td className="px-4 py-2 text-sm">{i.categoria}</td>
                        <td className="px-4 py-2 text-sm">{i.fecha?.substring(0, 10)}</td>
                        <td className="px-4 py-2 text-sm">{i.comprobante}</td>
                        <td className="px-4 py-2 text-sm">{i.concepto}</td>
                        <td className="px-4 py-2 text-sm text-right text-green-700">$ {i.importe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    {data.ingresos.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-4 text-center text-gray-500">No hay movimientos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Detalle de Gastos</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Origen</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Comprobante</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.gastos.map((i: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{i.origen}</td>
                        <td className="px-4 py-2 text-sm">{i.categoria}</td>
                        <td className="px-4 py-2 text-sm">{i.fecha?.substring(0, 10)}</td>
                        <td className="px-4 py-2 text-sm">{i.comprobante}</td>
                        <td className="px-4 py-2 text-sm">{i.concepto}</td>
                        <td className="px-4 py-2 text-sm text-right text-red-700">$ {i.importe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    {data.gastos.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-4 text-center text-gray-500">No hay movimientos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
