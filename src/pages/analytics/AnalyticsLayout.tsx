import React, { useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import Delphinium from './tabs/Delphinium';
import Veronicas from './tabs/Veronicas';
import AstronovaDanos from './tabs/AstronovaDanos';
import Productividad from './tabs/Productividad';
import Comparativas from './tabs/Comparativas';
import { BarChart2, PieChart, TrendingUp, Activity, Layers, ChevronRight } from 'lucide-react';

const TABS = [
  { id: 'productividad', label: 'General', icon: BarChart2, color: 'indigo' },
  { id: 'delphinium', label: 'Delphinium', icon: TrendingUp, color: 'blue' },
  { id: 'veronicas', label: 'Verónicas', icon: Activity, color: 'emerald' },
  { id: 'astronova', label: 'Daños', icon: PieChart, color: 'rose' },
  { id: 'comparativas', label: 'Comparativas', icon: Layers, color: 'amber' },
];

export default function AnalyticsLayout() {
  const [activeTab, setActiveTab] = useState('productividad');

  const renderContent = () => {
    switch (activeTab) {
      case 'delphinium': return <Delphinium />;
      case 'veronicas': return <Veronicas />;
      case 'astronova': return <AstronovaDanos />;
      case 'productividad': return <Productividad />;
      case 'comparativas': return <Comparativas />;
      default: return <Productividad />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* HEADER MODERNO */}
        <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
                <span>Analítica</span>
                <ChevronRight size={12} />
                <span className="text-indigo-600">
                  {TABS.find(t => t.id === activeTab)?.label}
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">INTELIGENCIA AGRÍCOLA</h1>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-sm">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-indigo-600 shadow-md transform scale-105'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                  }`}
                >
                  <tab.icon size={18} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ÁREA DE CONTENIDO */}
        <div className="p-8 max-w-7xl mx-auto">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
