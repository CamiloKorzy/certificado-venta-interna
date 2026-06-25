import React, { useState, useEffect } from 'react';
import { Loader2, FileText, Search } from 'lucide-react';
import { apiFetch } from '../App';

export default function FacturasCompras({ token, unidadNegocio, periodo }: { token: string, unidadNegocio: string, periodo: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Convert MM/YYYY to first and last day of month
        const [m, y] = periodo.split('/');
        const fechaDesde = `${y}-${m}-01`;
        const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
        const fechaHasta = `${y}-${m}-${lastDay}`;
        
        const res = await apiFetch(`/api/compras?empresa=${encodeURIComponent(unidadNegocio)}&fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`, token);
        if (!res.ok) throw new Error("Error al obtener facturas de compras");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [unidadNegocio, periodo, token]);

  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.comprobante && item.comprobante.toLowerCase().includes(term)) ||
      (item.proveedor && item.proveedor.toLowerCase().includes(term)) ||
      (item.categoria && item.categoria.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-[1800px] mx-auto px-6 py-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-blue-600" />
            Facturas de Compras (Soporte)
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar factura o proveedor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 size={32} className="animate-spin mb-4 text-blue-500" />
            <p>Cargando facturas de compras...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
            {error}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No se encontraron facturas de compras para este periodo y unidad de negocio. Asegúrese de haber configurado los Gastos Compras en Configuración.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-bold text-slate-600 uppercase text-xs">Fecha</th>
                  <th className="p-4 font-bold text-slate-600 uppercase text-xs">Tipo Documento</th>
                  <th className="p-4 font-bold text-slate-600 uppercase text-xs">Comprobante</th>
                  <th className="p-4 font-bold text-slate-600 uppercase text-xs">Proveedor</th>
                  <th className="p-4 font-bold text-slate-600 uppercase text-xs text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-600">
                      {item.fecha ? new Date(item.fecha).toLocaleDateString('es-AR') : '-'}
                    </td>
                    <td className="p-4 text-slate-600">{item.categoria || '-'}</td>
                    <td className="p-4 font-medium text-slate-800">{item.comprobante || '-'}</td>
                    <td className="p-4 text-slate-600">{item.proveedor || '-'}</td>
                    <td className="p-4 text-right font-mono font-bold text-slate-800">
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.importe || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
