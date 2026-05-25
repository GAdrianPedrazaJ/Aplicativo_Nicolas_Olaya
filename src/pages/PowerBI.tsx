import React, { useState, useMemo, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart
} from 'recharts'
import { useSupabase } from '../hooks/useSupabase'
import { ChevronDown } from 'lucide-react'

const COLORS = {
  primary: '#005d5d', // Teal GHT
  secondary: '#f5a623', // Naranja GHT
  bg: '#f3f2f1',
  border: '#e1e4e8'
};

export default function PowerBI() {
  const supabase = useSupabase()
  const [indices, setIndices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data: iData } = await supabase
          .from('indices_semanales')
          .select('*')
          .order('semana', { ascending: true })
          .limit(52)
        setIndices(iData || [])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Datos simulados para las tablas inferiores para que coincidan con la captura
  const mockTableData = [
    { name: '479', prod: '188,4', area: '519' },
    { name: '41', prod: '147,9', area: '795' },
    { name: '413', prod: '141,0', area: '408' },
    { name: '475', prod: '122,8', area: '922' },
    { name: '62', prod: '121,3', area: '1.543' },
    { name: '88', prod: '118,6', area: '1.493' },
    { name: '29', prod: '116,8', area: '1.615' },
  ];

  if (loading) return <div className="p-20 text-center text-slate-400 font-bold tracking-widest">CARGANDO REPORTE...</div>;

  return (
    <div className="flex flex-col gap-3 bg-[#f3f2f1] p-3 min-h-full">

      {/* 1. SLICERS - BARRA DE FILTROS SUPERIOR */}
      <div className="bg-white p-3 rounded shadow-sm border border-slate-200 flex flex-wrap gap-8 items-center">
        <Slicer label="Semana" value="202512" />
        <Slicer label="Flor" value="Todas" />
        <Slicer label="Finca" value="Todas" />
        <Slicer label="Color" value="Todas" />
        <Slicer label="Variedad" value="Selección múltiple" />
        <Slicer label="Bloque" value="Todas" />
        <Slicer label="Estado" value="Producción" />
      </div>

      {/* 2. DASHBOARD - FILA SUPERIOR / CENTRAL */}
      <div className="grid grid-cols-12 gap-3">

        {/* Gráfico Barras Verticales (Izquierda) */}
        <div className="col-span-12 lg:col-span-3 bg-white p-4 rounded shadow-sm border border-slate-200">
          <h3 className="text-[10px] font-bold text-[#005d5d] mb-4 uppercase">Productividad por grupo de trabajo</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={indices.slice(0, 12)} margin={{ left: -30 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="semana" type="category" style={{ fontSize: '9px', fontWeight: 'bold', fill: '#666' }} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="tallos_m2" fill="#f5a623" radius={[0, 2, 2, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Líneas (Centro) */}
        <div className="col-span-12 lg:col-span-5 bg-white p-4 rounded shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-bold text-[#005d5d] uppercase">Productividad recepción 52 semanas</h3>
            <div className="flex gap-4 text-[9px] font-bold text-slate-400">
              <span className="flex items-center gap-1"><div className="w-2 h-0.5 bg-[#f5a623]"></div> 2025</span>
              <span className="flex items-center gap-1"><div className="w-2 h-0.5 bg-[#005d5d]"></div> 2026</span>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={indices}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="semana" style={{ fontSize: '9px', fill: '#999' }} />
                <YAxis style={{ fontSize: '9px', fill: '#999' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="tallos_m2" stroke="#f5a623" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="tallos_planta" stroke="#005d5d" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla de Supervisores (Derecha) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded shadow-sm border border-slate-200 flex flex-col">
          <div className="overflow-auto max-h-[340px]">
            <table className="w-full text-[10px]">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-400 font-bold">
                <tr>
                  <th className="px-3 py-2 text-left">Supervisor</th>
                  <th className="px-3 py-2 text-right">Productividad</th>
                  <th className="px-3 py-2 text-right">Área</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: 'RIVERA ORJUELA MARIA ANDREA', prod: '107,4', area: '13.133' },
                  { name: 'MENJURA QUINONEZ CONSUELO', prod: '90,2', area: '17.875' },
                  { name: 'GARCIA MONTAÑO ROSA ADRIANA', prod: '87,9', area: '18.605' },
                  { name: 'CAMARGO SILVA OLGA LUCIA', prod: '86,8', area: '19.018' },
                  { name: 'MAMANCHE ANGEL MARIA LILIA', prod: '85,0', area: '19.445' },
                  { name: 'GUTIERREZ RUGE TULIA ELISA', prod: '82,3', area: '20.467' },
                  { name: 'AVILA CARVAJAL DAMARIS', prod: '76,5', area: '8.733' },
                ].map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-1.5 truncate">{s.name}</td>
                    <td className="px-3 py-1.5 text-right font-bold text-slate-700">{s.prod}</td>
                    <td className="px-3 py-1.5 text-right text-slate-500 font-mono">{s.area}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-bold sticky bottom-0">
                <tr>
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 text-right text-[#005d5d]">220,4</td>
                  <td className="px-3 py-2 text-right text-slate-600">359.139</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* 3. DASHBOARD - FILA INFERIOR (TABLAS MINI) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <MiniTable title="Grupo trabajo" data={mockTableData} />
        <MiniTable title="Variedad" data={mockTableData} />
        <MiniTable title="Bloque" data={mockTableData} />
      </div>
    </div>
  )
}

function Slicer({ label, value }: any) {
  return (
    <div className="flex flex-col border-r border-slate-100 pr-6 last:border-0 min-w-[100px]">
      <span className="text-[9px] font-bold text-[#005d5d] uppercase mb-0.5 tracking-tighter opacity-70">{label}</span>
      <div className="flex items-center justify-between cursor-pointer group">
        <span className="text-[11px] text-slate-600 font-medium group-hover:text-[#005d5d] transition-colors">{value}</span>
        <ChevronDown size={10} className="text-slate-300 group-hover:text-[#005d5d]" />
      </div>
    </div>
  );
}

function MiniTable({ title, data }: any) {
  return (
    <div className="bg-white rounded shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="px-3 py-1.5 bg-white border-b border-slate-100 flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-700 uppercase">{title}</span>
        <div className="flex gap-6 text-[9px] font-bold text-slate-400">
          <span className="w-16 text-right">Productividad</span>
          <span className="w-12 text-right">Área</span>
        </div>
      </div>
      <div className="overflow-y-auto h-[180px]">
        <table className="w-full text-[10px]">
          <tbody className="divide-y divide-slate-50">
            {data.map((item: any, i: number) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-3 py-1 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200 border border-slate-300"></div>
                  <span className="truncate">{item.name}</span>
                </td>
                <td className="px-3 py-1 text-right font-medium text-slate-700 w-16">{item.prod}</td>
                <td className="px-3 py-1 text-right text-slate-400 w-12 font-mono">{item.area}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-50 border-t border-slate-100 px-3 py-1.5 flex justify-between text-[10px] font-bold">
        <span>Total</span>
        <div className="flex gap-6">
          <span className="w-16 text-right text-[#005d5d]">220,4</span>
          <span className="w-12 text-right text-slate-600">359.139</span>
        </div>
      </div>
    </div>
  );
}
