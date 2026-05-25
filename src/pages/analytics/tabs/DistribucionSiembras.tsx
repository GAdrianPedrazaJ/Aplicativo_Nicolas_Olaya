import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ChevronDown, Sprout, PieChart as PieIcon } from 'lucide-react';

const COLORS = ['#005d5d', '#f5a623', '#26c6da', '#4a90d9', '#e05252'];

const mockData = [
  { name: 'Verónica Spray', valor: 450, area: 12500 },
  { name: 'Delphinium', valor: 320, area: 8900 },
  { name: 'Astronova', valor: 210, area: 5600 },
  { name: 'Campanula', valor: 150, area: 4200 },
];

export default function DistribucionSiembras() {
  return (
    <div className="flex flex-col gap-4">

      {/* SLICERS */}
      <div className="bg-white p-3 border-b border-slate-100 flex flex-wrap gap-8 items-center">
        <Slicer label="Finca" value="Todas" />
        <Slicer label="Línea" value="Todas" />
        <div className="ml-auto flex gap-6 border-l border-slate-100 pl-6">
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-bold text-[#005d5d] uppercase">Área Total Sembrada</span>
            <span className="text-sm font-black text-slate-800">31.200 mt2</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Gráfico de Distribución */}
        <div className="col-span-12 lg:col-span-7 bg-white p-5 rounded border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-bold text-[#005d5d] mb-6 uppercase tracking-wider flex items-center gap-2">
            <PieIcon size={14} />
            Distribución de Área por Producto (mt2)
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" style={{ fontSize: '10px', fill: '#999' }} hide />
                <YAxis dataKey="name" type="category" style={{ fontSize: '10px', fill: '#333', fontWeight: 'bold' }} axisLine={false} />
                <Tooltip cursor={{fill: '#f8f9fa'}} />
                <Bar dataKey="area" fill="#005d5d" radius={[0, 4, 4, 0]} barSize={30}>
                  {mockData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#005d5d' : '#f5a623'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla de Detalle */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded border border-slate-200 shadow-sm flex flex-col">
          <table className="w-full text-[10px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold">
              <tr>
                <th className="px-3 py-2 text-left">Producto</th>
                <th className="px-3 py-2 text-right">Camas</th>
                <th className="px-3 py-2 text-right">Área mt2</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockData.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2 font-bold text-slate-700">{row.name}</td>
                  <td className="px-3 py-2 text-right font-mono">{row.valor}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-[#005d5d]">{row.area.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-auto p-6 bg-slate-50/50 border-t border-slate-100">
            <div className="flex items-center gap-3 text-[#005d5d]">
              <Sprout size={20} />
              <div>
                <p className="text-[10px] font-bold uppercase">Estado de Siembra</p>
                <p className="text-xs text-slate-500 font-medium">92% de la capacidad instalada en uso.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slicer({ label, value }: any) {
  return (
    <div className="flex flex-col min-w-[120px]">
      <span className="text-[9px] font-bold text-[#005d5d] uppercase mb-0.5 tracking-tighter opacity-70">{label}</span>
      <div className="flex items-center justify-between cursor-pointer group">
        <span className="text-[11px] text-slate-600 font-bold group-hover:text-[#005d5d] transition-colors">{value}</span>
        <ChevronDown size={10} className="text-slate-300 group-hover:text-[#005d5d]" />
      </div>
    </div>
  );
}
