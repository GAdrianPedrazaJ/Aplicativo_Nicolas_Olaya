import React from 'react'

type Option = 'planos' | 'historicos' | 'powerbi'

export default function NavBar({ selected, onSelect }: { selected: Option; onSelect: (o: Option) => void }) {
  const btn = (id: Option, label: string) => (
    <button
      onClick={() => onSelect(id)}
      className={`px-4 py-2 rounded-full font-medium ${selected === id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
    >
      {label}
    </button>
  )

  return (
    <div className="w-full bg-white border-b">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="text-lg font-semibold">RDC Tandil SAS</div>
        <nav className="space-x-3">
          {btn('planos', 'Planos de Siembra')}
          {btn('historicos', 'Históricos')}
          {btn('powerbi', 'Power BI')}
        </nav>
      </div>
    </div>
  )
}
