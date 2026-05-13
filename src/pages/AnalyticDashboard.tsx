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
import {
  BarChart2,
  ChevronRight,
  Calendar,
  RefreshCcw,
  AlertTriangle,
  BarChart3,
  Box,
  Activity,
  Flower2,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

const TABS = [
  { id: 'comparativas', label: 'Comparativas', icon: BarChart3, color: 'indigo' },
  { id: 'veronicas', label: 'Verónica Spray', icon: Activity, color: 'emerald' },
  { id: 'delphinium', label: 'Delphinium', icon: Flower2, color: 'blue' },
  { id: 'astronova', label: 'Daños Astronova', icon: ShieldAlert, color: 'rose' },
  { id: 'semanal', label: 'Producción General', icon: Calendar, color: 'amber' },
  { id: 'ciclos', label: 'Ciclos', icon: RefreshCcw, color: 'purple' },
  { id: 'danos', label: 'Gestión Daños', icon: AlertTriangle, color: 'orange' },
  { id: 'bloques', label: 'Bloques vs Producto', icon: Box, color: 'cyan' },
];

export default function AnalyticDashboard() {
  const [activeTab, setActiveTab] = useState('comparativas');

  const renderContent = () => {
    switch (activeTab) {
      case 'comparativas': return <Comparativas />;
      case 'veronicas': return <Veronicas />;
      case 'delphinium': return <Delphinium />;
      case 'astronova': return <AstronovaDanos />;
      case 'semanal': return <ProduccionSemanal />;
      case 'ciclos': return <CiclosProductividad />;
      case 'danos': return <Danos />;
      case 'bloques': return <BloquesVsProducto />;
      default: return <Comparativas />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* ENCABEZADO MODERNO */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-8 sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                    <Sparkles size={12} className="animate-pulse" />
                    <span>Inteligencia de Datos</span>
                    <ChevronRight size={10} className="text-slate-300" />
                    <span className="text-slate-400">Analítica</span>
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">CENTRO DE ANALÍTICA</h1>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden lg:flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Sincronizado</span>
                  </div>
                </div>
              </div>

              {/* TABS NAVEGABLES */}
              <div className="flex bg-slate-100/80 p-1.5 rounded-[22px] border border-slate-200/50 w-full overflow-x-auto no-scrollbar">
                <div className="flex gap-1 min-w-max">
                  {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[11px] font-black transition-all duration-300 uppercase tracking-wider
                          ${isActive
                            ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200/50 translate-y-[-1px]'
                            : 'text-slate-500 hover:text-indigo-600 hover:bg-white/40'
                          }
                        `}
                      >
                        <tab.icon size={16} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ÁREA DE CONTENIDO */}
        <div className="p-8 max-w-7xl mx-auto">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
