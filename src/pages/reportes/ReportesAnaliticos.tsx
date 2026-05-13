import { useMemo } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { useAnalytics } from '../../hooks/useAnalytics';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Filter, TrendingUp, Package, Layers, Calendar } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

export default function ReportesAnaliticos() {
  const { loading, filtros, setFiltros, dimensions, data } = useAnalytics();

  // Obtener las llaves dinámicas para las líneas de la gráfica (Productos o Variedades)
  const lineKeys = useMemo(() => {
    if (!data.lineData.length) return [];
    return Object.keys(data.lineData[0]).filter(k => k !== 'semana' && k !== 'total');
  }, [data.lineData]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Procesando datos analíticos...</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* HEADER Y FILTROS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                  <TrendingUp className="text-green-600" /> Analítica de Productividad
                </h1>
                <p className="text-slate-500 text-sm">Análisis de ciclos y rendimiento por dimensiones</p>
              </div>

              {/* BARRA DE FILTROS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <select
                  value={filtros.anio}
                  onChange={e => setFiltros({...filtros, anio: Number(e.target.value)})}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-green-500"
                >
                  {[2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <select
                  value={filtros.producto}
                  onChange={e => setFiltros({...filtros, producto: e.target.value, variedad: 'ALL'})}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="ALL">Todos los Productos</option>
                  {dimensions.productos.map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <select
                  value={filtros.bloque}
                  onChange={e => setFiltros({...filtros, bloque: e.target.value})}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="ALL">Todos los Bloques</option>
                  {dimensions.bloques.map(b => <option key={b} value={b}>{b}</option>)}
                </select>

                <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Semanas {filtros.semanaInicio}-{filtros.semanaFin}</span>
                </div>
              </div>
            </div>
          </div>

          {/* KPIs INTELIGENTES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Producción Total</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{data.kpis.totalTallos.toLocaleString()} <span className="text-sm font-normal text-slate-400">tallos</span></h3>
              <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-2/3" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Promedio Semanal</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{data.kpis.promedioSemanal.toLocaleString()}</h3>
              <p className="text-green-600 text-xs mt-2 font-bold flex items-center gap-1">
                <TrendingUp size={12} /> Rendimiento estable en el periodo
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Pico de Producción</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{data.kpis.maxProduccion.toLocaleString()}</h3>
              <p className="text-slate-400 text-xs mt-2 italic">Máximo registrado en una semana</p>
            </div>
          </div>

          {/* GRÁFICA PRINCIPAL: TENDENCIAS Y CICLOS */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="mb-8">
              <h2 className="text-lg font-bold text-slate-800">Evolución de Cosecha</h2>
              <p className="text-sm text-slate-500">Visualización de ciclos de productividad (Semana a Semana)</p>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="semana"
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#94a3b8', fontSize: 12}}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#94a3b8', fontSize: 12}}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                  {lineKeys.map((key, index) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* COMPARATIVAS SECUNDARIAS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PRODUCCIÓN POR BLOQUE */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Eficiencia por Bloque</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.barByBlock}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Bar dataKey="tallos" radius={[6, 6, 0, 0]}>
                      {data.barByBlock.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* INFORMACIÓN DE DIMENSIONES */}
            <div className="bg-slate-900 p-8 rounded-2xl shadow-xl text-white flex flex-col justify-center">
              <h2 className="text-xl font-bold mb-2">Resumen Analítico</h2>
              <p className="text-slate-400 text-sm mb-8">Hallazgos clave basados en los filtros actuales.</p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <Layers className="text-green-400" size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Bloque más productivo</p>
                    <p className="text-lg font-bold">{data.barByBlock.sort((a,b) => b.tallos - a.tallos)[0]?.name || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Package className="text-blue-400" size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Producto Dominante</p>
                    <p className="text-lg font-bold">{filtros.producto === 'ALL' ? 'Múltiples' : filtros.producto}</p>
                  </div>
                </div>
              </div>

              <button className="mt-10 w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors">
                Exportar Reporte Detallado
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
