import React from 'react'

type Option = 'planos' | 'historicos' | 'dashboard'

export default function NavBar({ selected, onSelect }: { selected: Option; onSelect: (o: Option) => void }) {
  const btn = (id: Option, label: string) => (
    <button
      onClick={() => onSelect(id)}
      className={`px-5 py-2 rounded-xl font-semibold transition-all duration-200 ${
        selected === id
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105'
          : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {label}
    </button>
  )

  return (
    <header className="w-full bg-white/70 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <span className="text-white font-bold text-xl">R</span>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-indigo-700">
              RDC Tandil SAS
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Gestión Agrícola</p>
          </div>
        </div>

        <nav className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-2xl">
          {btn('dashboard', 'Dashboard')}
          {btn('planos', 'Planos de Siembra')}
          {btn('historicos', 'Históricos')}
        </nav>
      </div>
    </header>
  )
}
