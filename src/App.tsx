import React from 'react'
import { useState } from 'react'
import CargaSiembras from './pages/CargaSiembras'
import CargaHistoricos from './pages/CargaHistoricos'
import PowerBI from './pages/PowerBI'
import NavBar from './components/shared/NavBar'

type View = 'planos' | 'historicos' | 'dashboard'

type Option = 'planos' | 'historicos' | 'dashboard'

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const isDashboard = view === 'dashboard'

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 text-gray-900 overflow-hidden">
      <NavBar selected={view} onSelect={(o) => setView(o as View)} />

      {isDashboard ? (
        <div className="flex-1 overflow-auto w-full">
          <PowerBI />
        </div>
      ) : (
        <main className="flex-1 overflow-auto w-full p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {view === 'planos' && (
              <div className="grid gap-6 md:grid-cols-1">
                <CargaSiembras />
              </div>
            )}

            {view === 'historicos' && (
              <div className="grid gap-6 md:grid-cols-1">
                <CargaHistoricos />
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  )
}
