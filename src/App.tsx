import React from 'react'
import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import CargaSiembras from './pages/CargaSiembras'
import CargaHistoricos from './pages/CargaHistoricos'
import PowerBI from './pages/PowerBI'
import NavBar from './components/shared/NavBar'

type View = 'planos' | 'historicos' | 'powerbi' | 'dashboard'

type Option = 'planos' | 'historicos' | 'powerbi'

export default function App() {
  const [view, setView] = useState<View>('dashboard')

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
  <NavBar selected={view === 'dashboard' ? 'dashboard' : view === 'planos' ? 'planos' : view === 'historicos' ? 'historicos' : 'powerbi'} onSelect={(o) => setView(o as View)} />

      <main className="p-8 max-w-6xl mx-auto">
        <div className="space-y-6">
          {view === 'dashboard' && <Dashboard />}

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

          {view === 'powerbi' && <PowerBI />}
        </div>
      </main>
    </div>
  )
}
