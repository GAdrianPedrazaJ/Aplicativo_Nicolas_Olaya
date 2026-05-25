import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';

import ProduccionSemanal from './analytics/tabs/ProduccionSemanal';
import CiclosProductividad from './analytics/tabs/CiclosProductividad';
import Danos from './analytics/tabs/Danos';
import Comparativas from './analytics/tabs/Comparativas';
import BloquesVsProducto from './analytics/tabs/BloquesVsProducto';
import Veronicas from './analytics/tabs/Veronicas';
import Delphinium from './analytics/tabs/Delphinium';
import AstronovaDanos from './analytics/tabs/AstronovaDanos';
import Productividad from './analytics/tabs/Productividad';
import DistribucionSiembras from './analytics/tabs/DistribucionSiembras';
import PowerBI from './PowerBI';

const TABS = [
  { id: 'cpc', label: 'Productividad CPC', component: <PowerBI /> },
  { id: 'productividad', label: 'Productividad 12 meses', component: <Productividad /> },
  { id: 'semanal', label: 'Productividad Semana', component: <ProduccionSemanal /> },
  { id: 'ciclos', label: 'Serie Productividad Año', component: <CiclosProductividad /> },
  { id: 'siembras', label: 'Análisis Productividad y Área', component: <DistribucionSiembras /> },
  { id: 'bloques', label: 'Bloque Variedad', component: <BloquesVsProducto /> },
  { id: 'veronicas', label: 'Verónica Spray', component: <Veronicas /> },
  { id: 'delphinium', label: 'Delphinium', component: <Delphinium /> },
  { id: 'danos', label: 'Gestión Daños', component: <Danos /> },
];

export default function AnalyticDashboard() {
  const [currentTab, setCurrentTab] = useState('cpc');
  const activeTabData = TABS.find(t => t.id === currentTab);

  return (
    <div className="flex flex-col h-screen bg-[#eeeeee] font-sans overflow-hidden">
      {/* NAVBAR SUPERIOR GLOBAL */}
      <Sidebar />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-[1600px] mx-auto">
            {/* Render Active Component directamente sin encabezados extra */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[calc(100vh-120px)] overflow-hidden">
               {activeTabData?.component}
            </div>
          </div>
        </div>

        {/* BOTTOM TABS - ESTILO POWER BI (FIJO ABAJO) */}
        <div className="bg-white border-t border-slate-300 h-10 flex items-center px-2 shrink-0 z-20 overflow-x-auto no-scrollbar">
          <div className="flex h-full items-center">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`
                  px-5 h-full flex items-center text-[10px] font-black whitespace-nowrap border-t-4 transition-all uppercase tracking-wider
                  ${currentTab === tab.id
                    ? 'bg-white border-[#005d5d] text-[#005d5d] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]'
                    : 'bg-[#f8f9fa] border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600 border-r border-slate-200'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
