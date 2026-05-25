import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const data = [
  { name: 'Ene', real: 4000, esperado: 4400 },
  { name: 'Feb', real: 3000, esperado: 3200 },
  { name: 'Mar', real: 2000, esperado: 2400 },
  { name: 'Abr', real: 2780, esperado: 2908 },
  { name: 'May', real: 1890, esperado: 4800 },
  { name: 'Jun', real: 2390, esperado: 3800 },
  { name: 'Jul', real: 3490, esperado: 4300 },
];

export default function Productividad() {
  return (
    <div className="flex flex-col gap-4">
      {/* Slicers específicos de la pestaña */}
      <div className="flex gap-6 p-3 bg-white border-b border-slate-100 items-center">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-[#005d5d] uppercase">Rango de Fecha</span>
          <span className="text-[11px] text-slate-600 font-medium">Últimos 12 meses</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-[#005d5d] uppercase">Sede</span>
          <span className="text-[11px] text-slate-600 font-medium">Todas</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Gráfico de Barras Estilo Power BI */}
        <div className="col-span-12 lg:col-span-7 bg-white p-4 rounded border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-bold text-[#005d5d] mb-6 uppercase tracking-wider">Diferencias mt2 producción vs. área por sede, color, variedad y bloque</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" style={{ fontSize: '10px', fill: '#999' }} axisLine={false} tickLine={false} />
                <YAxis style={{ fontSize: '10px', fill: '#999' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8f9fa'}} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                <Bar name="Producción Real" dataKey="real" fill="#f5a623" radius={[2, 2, 0, 0]} barSize={40} />
                <Bar name="Área / Esperado" dataKey="esperado" fill="#005d5d" radius={[2, 2, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla Lateral Estilo Power BI */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded border border-slate-200 shadow-sm flex flex-col">
          <div className="overflow-auto">
            <table className="w-full text-[10px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold">
                <tr>
                  <th className="px-3 py-2 text-left">Color</th>
                  <th className="px-3 py-2 text-right">Productividad año</th>
                  <th className="px-3 py-2 text-right">Producción</th>
                  <th className="px-3 py-2 text-right">% prod.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { color: 'Burgundy', prod: '188,3', total: '119.055', perc: '0.2%' },
                  { color: 'White', prod: '187,2', total: '8.121.370', perc: '11.3%' },
                  { color: 'Purple', prod: '189,6', total: '4.251.728', perc: '5.9%' },
                  { color: 'Peach', prod: '185,9', total: '2.110.660', perc: '2.9%' },
                  { color: 'Pink', prod: '161,5', total: '8.090.700', perc: '11.2%' },
                  { color: 'Novelty Pink', prod: '181,4', total: '774.373', perc: '1.1%' },
                  { color: 'Yellow', prod: '151,5', total: '7.715.549', perc: '10.8%' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-1.5 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: row.color.toLowerCase() }}></div>
                       {row.color}
                    </td>
                    <td className="px-3 py-1.5 text-right font-bold text-slate-700">{row.prod}</td>
                    <td className="px-3 py-1.5 text-right text-slate-500 font-mono">{row.total}</td>
                    <td className="px-3 py-1.5 text-right text-slate-400">{row.perc}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                <tr>
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 text-right text-[#005d5d]">138,1</td>
                  <td className="px-3 py-2 text-right">71.658.240</td>
                  <td className="px-3 py-2 text-right">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
