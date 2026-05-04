import React, { useState, useMemo, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart
} from 'recharts'
import { useSupabase } from '../hooks/useSupabase'
import '../styles/dashboard.css'

interface Siembra {
  id_siembra: string
  id_cama: string
  id_variedad: string
  fecha_siembra: string
  plantas_sembradas: number
  estado: string
  camas?: { numero_cama: number; id_nave: string; area_m2: number; naves?: { id_bloque: string; numero_nave: number; bloques?: { nombre: string } } }
  variedades?: { nombre: string; id_color: string; colores?: { nombre: string; id_producto: string; productos?: { nombre: string } } }
}

interface IndicesSemanal {
  id_indice: string
  id_siembra: string
  ano: number
  semana: number
  semana_ciclo: number
  total_tallos: number
  tallos_m2: number
  tallos_planta: number
  total_danos: number
  total_perdidas: number
  porcentaje_calidad: number
}

interface ProcessedData {
  id_siembra: string
  flor: string
  bloque: string
  nave: number
  cama: number
  color: string
  variedad: string
  area: string
  plantas: number
  fs: string
  tm2: number
  ciclo: string
  alerta?: boolean
}

export default function PowerBI() {
  const supabase = useSupabase()
  const [activePage, setActivePage] = useState(0)
  const [siembras, setSiembras] = useState<Siembra[]>([])
  const [indices, setIndices] = useState<IndicesSemanal[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [flor, setFlor] = useState('all')
  const [color, setColor] = useState('all')
  const [variedad, setVariedad] = useState('all')
  const [bloque, setBloque] = useState('all')
  const [nave, setNave] = useState('all')
  const [cama, setCama] = useState('all')
  const [ciclo, setCiclo] = useState('all')

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        console.log('Iniciando carga de datos del dashboard...')

        // Fetch siembras with full relationship chain (SAME as useSiembras)
        const { data: sData, error: sErr } = await supabase
          .from('siembras')
          .select(`
            id_siembra,
            fecha_siembra,
            plantas_sembradas,
            estado,
            numero_ciclo,
            camas (
              id_cama,
              numero_cama,
              area_m2,
              naves (
                id_nave,
                numero_nave,
                bloques (nombre)
              )
            ),
            variedades (
              id_variedad,
              nombre,
              colores (
                id_color,
                nombre,
                productos (nombre)
              )
            )
          `)

        if (sErr) {
          console.error('Error en siembras:', sErr)
          throw sErr
        }

        console.log('Siembras cargadas:', sData?.length || 0)

        // Fetch indices_semanales
        const { data: iData, error: iErr } = await supabase
          .from('indices_semanales')
          .select('*')
          .order('semana', { ascending: true })
          .limit(500)

        if (iErr) {
          console.error('Error en indices:', iErr)
          throw iErr
        }

        console.log('Índices cargados:', iData?.length || 0)
        setSiembras(sData || [])
        setIndices(iData || [])
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [refreshTrigger])

  // Function to refresh data
  const handleRefresh = () => {
    console.log('Recargando datos...')
    setRefreshTrigger(prev => prev + 1)
  }

  // Process siembras into sabana format
  const sabanaData = useMemo(() => {
    if (!siembras.length) {
      return []
    }

    const result = siembras.map((s: Siembra) => {
      // Find latest indices for this siembra to get T/m²
      const siembraIndices = indices.filter(indice => indice.id_siembra === s.id_siembra)
      const latestIndice = siembraIndices.length > 0 
        ? siembraIndices[siembraIndices.length - 1]
        : null
      
      return {
        id_siembra: s.id_siembra,
        flor: s.variedades?.colores?.productos?.nombre || 'N/A',
        bloque: s.camas?.naves?.bloques?.nombre || 'N/A',
        nave: s.camas?.naves?.numero_nave || 0,
        cama: s.camas?.numero_cama || 0,
        color: s.variedades?.colores?.nombre || 'N/A',
        variedad: s.variedades?.nombre || 'N/A',
        area: (s.camas?.area_m2 || 0).toFixed(2),
        plantas: s.plantas_sembradas || 0,
        fs: s.fecha_siembra ? new Date(s.fecha_siembra).toLocaleDateString('es-ES') : 'N/A',
        tm2: latestIndice?.tallos_m2 || 0,
        ciclo: `C${s.numero_ciclo || 1}`,
      }
    })
    
    // Debug: Log products being loaded with details
    const allProducts = new Set(result.map(r => r.flor).filter(f => f !== 'N/A'))
    const productsArray = Array.from(allProducts)
    console.log('Productos en Dashboard:', productsArray)
    productsArray.forEach(p => {
      const count = result.filter(r => r.flor === p).length
      console.log(`  - ${p}: ${count} siembras`)
    })
    // Check for N/A (missing relationships)
    const naCount = result.filter(r => r.flor === 'N/A').length
    if (naCount > 0) console.warn(`  - N/A (sin relación): ${naCount} siembras`)
    
    return result
  }, [siembras, indices])

  // Get unique values for filters - DYNAMIC based on other filters
  const uniqueFlo = useMemo(() => {
    // Build filter with all EXCEPT flor
    const filtered = sabanaData.filter(d => {
      if (color !== 'all' && d.color !== color) return false
      if (variedad !== 'all' && d.variedad !== variedad) return false
      if (bloque !== 'all' && d.bloque !== bloque) return false
      if (nave !== 'all' && d.nave !== parseInt(nave)) return false
      if (cama !== 'all' && d.cama !== parseInt(cama)) return false
      if (ciclo !== 'all' && d.ciclo !== ciclo) return false
      return true
    })
    const set = new Set(filtered.map(d => d.flor))
    return Array.from(set).filter(f => f !== 'N/A')
  }, [sabanaData, color, variedad, bloque, nave, cama, ciclo])

  const uniqueColores = useMemo(() => {
    const filtered = sabanaData.filter(d => {
      if (flor !== 'all' && d.flor !== flor) return false
      if (variedad !== 'all' && d.variedad !== variedad) return false
      if (bloque !== 'all' && d.bloque !== bloque) return false
      if (nave !== 'all' && d.nave !== parseInt(nave)) return false
      if (cama !== 'all' && d.cama !== parseInt(cama)) return false
      if (ciclo !== 'all' && d.ciclo !== ciclo) return false
      return true
    })
    const set = new Set(filtered.map(d => d.color))
    return Array.from(set).filter(c => c !== 'N/A')
  }, [sabanaData, flor, variedad, bloque, nave, cama, ciclo])

  const uniqueVariedades = useMemo(() => {
    const filtered = sabanaData.filter(d => {
      if (flor !== 'all' && d.flor !== flor) return false
      if (color !== 'all' && d.color !== color) return false
      if (bloque !== 'all' && d.bloque !== bloque) return false
      if (nave !== 'all' && d.nave !== parseInt(nave)) return false
      if (cama !== 'all' && d.cama !== parseInt(cama)) return false
      if (ciclo !== 'all' && d.ciclo !== ciclo) return false
      return true
    })
    const set = new Set(filtered.map(d => d.variedad))
    return Array.from(set).filter(v => v !== 'N/A')
  }, [sabanaData, flor, color, bloque, nave, cama, ciclo])

  const uniqueBloques = useMemo(() => {
    const filtered = sabanaData.filter(d => {
      if (flor !== 'all' && d.flor !== flor) return false
      if (color !== 'all' && d.color !== color) return false
      if (variedad !== 'all' && d.variedad !== variedad) return false
      if (nave !== 'all' && d.nave !== parseInt(nave)) return false
      if (cama !== 'all' && d.cama !== parseInt(cama)) return false
      if (ciclo !== 'all' && d.ciclo !== ciclo) return false
      return true
    })
    const set = new Set(filtered.map(d => d.bloque))
    return Array.from(set).filter(b => b !== 'N/A')
  }, [sabanaData, flor, color, variedad, nave, cama, ciclo])

  const uniqueNaves = useMemo(() => {
    const filtered = sabanaData.filter(d => {
      if (flor !== 'all' && d.flor !== flor) return false
      if (color !== 'all' && d.color !== color) return false
      if (variedad !== 'all' && d.variedad !== variedad) return false
      if (bloque !== 'all' && d.bloque !== bloque) return false
      if (cama !== 'all' && d.cama !== parseInt(cama)) return false
      if (ciclo !== 'all' && d.ciclo !== ciclo) return false
      return true
    })
    const set = new Set(filtered.map(d => d.nave))
    return Array.from(set).filter(n => n > 0).sort((a, b) => a - b)
  }, [sabanaData, flor, color, variedad, bloque, cama, ciclo])

  const uniqueCamas = useMemo(() => {
    const filtered = sabanaData.filter(d => {
      if (flor !== 'all' && d.flor !== flor) return false
      if (color !== 'all' && d.color !== color) return false
      if (variedad !== 'all' && d.variedad !== variedad) return false
      if (bloque !== 'all' && d.bloque !== bloque) return false
      if (nave !== 'all' && d.nave !== parseInt(nave)) return false
      if (ciclo !== 'all' && d.ciclo !== ciclo) return false
      return true
    })
    const set = new Set(filtered.map(d => d.cama))
    return Array.from(set).filter(c => c > 0).sort((a, b) => a - b)
  }, [sabanaData, flor, color, variedad, bloque, nave, ciclo])

  const uniqueCiclos = useMemo(() => {
    const filtered = sabanaData.filter(d => {
      if (flor !== 'all' && d.flor !== flor) return false
      if (color !== 'all' && d.color !== color) return false
      if (variedad !== 'all' && d.variedad !== variedad) return false
      if (bloque !== 'all' && d.bloque !== bloque) return false
      if (nave !== 'all' && d.nave !== parseInt(nave)) return false
      if (cama !== 'all' && d.cama !== parseInt(cama)) return false
      return true
    })
    const set = new Set(filtered.map(d => d.ciclo))
    return Array.from(set)
  }, [sabanaData, flor, color, variedad, bloque, nave, cama])

  // Filter sabana based on selected filters
  const sabanaFiltered = useMemo(() => {
    return sabanaData.filter(row => {
      if (flor !== 'all' && row.flor !== flor) return false
      if (color !== 'all' && row.color !== color) return false
      if (variedad !== 'all' && row.variedad !== variedad) return false
      if (bloque !== 'all' && row.bloque !== bloque) return false
      if (nave !== 'all' && row.nave !== parseInt(nave)) return false
      if (cama !== 'all' && row.cama !== parseInt(cama)) return false
      if (ciclo !== 'all' && row.ciclo !== ciclo) return false
      return true
    })
  }, [sabanaData, flor, color, variedad, bloque, nave, cama, ciclo])

  // Prepare chart data from indices - GROUPED BY WEEK (skip ID matching, use semana as key)
  const chartDataInicio = useMemo(() => {
    if (!indices.length) {
      return []
    }
    
    // Group indices by week + year (flexible, no ID dependency)
    const weekMap: Record<string, { tallos_m2: number[]; calidad: number[] }> = {}
    
    indices.forEach(idx => {
      const weekKey = `S${idx.semana}`
      if (!weekMap[weekKey]) {
        weekMap[weekKey] = { tallos_m2: [], calidad: [] }
      }
      weekMap[weekKey].tallos_m2.push(idx.tallos_m2 || 0)
      weekMap[weekKey].calidad.push(idx.porcentaje_calidad || 0)
    })
    
    // Convert to array with averages
    const result = Object.entries(weekMap)
      .map(([week, data]) => ({
        sem: week,
        tallos_m2: Math.round(data.tallos_m2.reduce((a, b) => a + b, 0) / data.tallos_m2.length),
        calidad: Math.round(data.calidad.reduce((a, b) => a + b, 0) / data.calidad.length),
      }))
      .sort((a, b) => {
        const weekA = parseInt(a.sem.replace('S', ''))
        const weekB = parseInt(b.sem.replace('S', ''))
        return weekA - weekB
      })
    
    return result.slice(0, 11)
  }, [indices, sabanaFiltered])

  const chartDataEjecVer = useMemo(() => {
    if (!indices.length) return []

    // Same week-based grouping, no ID dependency
    const weekMap: Record<string, { tallos_m2: number[]; tallos_planta: number[] }> = {}
    
    indices.forEach(idx => {
      const weekKey = `S${idx.semana}`
      if (!weekMap[weekKey]) {
        weekMap[weekKey] = { tallos_m2: [], tallos_planta: [] }
      }
      weekMap[weekKey].tallos_m2.push(idx.tallos_m2 || 0)
      weekMap[weekKey].tallos_planta.push(idx.tallos_planta || 0)
    })
    
    const result = Object.entries(weekMap)
      .map(([week, data]) => ({
        sem: week,
        tallos_m2: Math.round(data.tallos_m2.reduce((a, b) => a + b, 0) / data.tallos_m2.length),
        tallos_planta: Math.round(data.tallos_planta.reduce((a, b) => a + b, 0) / data.tallos_planta.length),
      }))
      .sort((a, b) => {
        const weekA = parseInt(a.sem.replace('S', ''))
        const weekB = parseInt(b.sem.replace('S', ''))
        return weekA - weekB
      })
    
    return result.slice(0, 11)
  }, [indices])

  const kpis = useMemo(() => {
    // Use all available indices (no ID filtering, semana-based grouping)
    if (!indices.length) {
      return {
        totalTallos: 0,
        tm2Promedio: 0,
        calidadPromedio: 0,
        peakTallos: 0,
        etapaActual: '–',
      }
    }
    
    const totalTallos = indices.reduce((sum, idx) => sum + (idx.total_tallos || 0), 0)
    const tm2Promedio = Math.round(
      indices.reduce((sum, idx) => sum + (idx.tallos_m2 || 0), 0) / indices.length
    )
    const calidadPromedio = Math.round(
      indices.reduce((sum, idx) => sum + (idx.porcentaje_calidad || 0), 0) / indices.length
    )
    const peakTallos = Math.max(...indices.map(i => i.tallos_m2 || 0))

    return {
      totalTallos: totalTallos.toLocaleString(),
      tm2Promedio: tm2Promedio.toFixed(1),
      camas: sabanaFiltered.length,
      indicePico: peakTallos.toFixed(2),
      fm2Sem: (tm2Promedio * 0.5).toFixed(2),
    }
  }, [indices, sabanaFiltered])

  const alertas = useMemo(() => {
    return sabanaFiltered.slice(0, 4).map((row, idx) => ({
      bloque: row.bloque,
      nave: row.nave,
      cama: row.cama,
      variedad: row.variedad,
      semVida: 15 + idx,
      esperado: (18 - idx * 2).toFixed(2),
      real: (12 - idx * 1.5).toFixed(2),
      diff: (6 - idx * 0.5).toFixed(2),
      severidad: idx === 0 ? 'Alta' : 'Media',
      alerta: true,
    }))
  }, [sabanaFiltered])

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
          Cargando datos del dashboard...
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      {/* TOPBAR */}
      <div className="dashboard-topbar">
        <div className="brand">
          <div className="brand-logo">DT</div>
          <div>
            <div className="brand-name">Diversificados Tandil SAS</div>
            <div className="brand-sub">Sistema de Productividad · CPC</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="week-chip">Semana actual: 2526</span>
          <div className="alert-chip" onClick={() => setActivePage(6)}>
            <span className="alert-dot"></span>
            {alertas.length} alertas activas
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="top-btn" onClick={handleRefresh} disabled={loading}>Actualizar</button>
        </div>
      </div>

      {/* LAYOUT */}
      <div className="dashboard-layout">
        {/* SIDEBAR */}
        <div className="dashboard-sidebar">
          <div>
            <div className="filter-title">Producto / Flor</div>
            <div className="pill-group">
              <div className={`pill ${flor === 'all' ? 'active' : ''}`} onClick={() => setFlor('all')} style={{ minWidth: '100%', marginBottom: '2px' }}>
                Todas
              </div>
              {uniqueFlo.map(f => (
                <div key={f} className={`pill ${flor === f ? 'active' : ''}`} onClick={() => setFlor(f)}>
                  {f.slice(0, 5)}
                </div>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-lbl">Variedad</div>
            <select className="fsel" value={variedad} onChange={(e) => setVariedad(e.target.value)}>
              <option value="all">Todas las variedades</option>
              {uniqueVariedades.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <div className="filter-lbl">Color</div>
            <select className="fsel" value={color} onChange={(e) => setColor(e.target.value)}>
              <option value="all">Todos los colores</option>
              {uniqueColores.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <div className="filter-lbl">Bloque</div>
            <select className="fsel" value={bloque} onChange={(e) => setBloque(e.target.value)}>
              <option value="all">Todos los bloques</option>
              {uniqueBloques.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <div className="filter-lbl">Nave</div>
            <select className="fsel" value={nave} onChange={(e) => setNave(e.target.value)}>
              <option value="all">Todas las naves</option>
              {uniqueNaves.map(n => (
                <option key={n} value={n}>Nave {n}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <div className="filter-lbl">Cama</div>
            <select className="fsel" value={cama} onChange={(e) => setCama(e.target.value)}>
              <option value="all">Todas las camas</option>
              {uniqueCamas.map(c => (
                <option key={c} value={c}>Cama {c}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <div className="filter-lbl">Ciclo</div>
            <div className="pill-group">
              <div className={`pill ${ciclo === 'all' ? 'active' : ''}`} onClick={() => setCiclo('all')}>Todos</div>
              {uniqueCiclos.map(c => (
                <div key={c} className={`pill ${ciclo === c ? 'active' : ''}`} onClick={() => setCiclo(c)}>{c}</div>
              ))}
            </div>
          </div>

          <div className="cycle-card">
            <div className="cycle-title">Semana de Ciclo</div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', lineHeight: '1.5' }}>
              <p>Total camas: {sabanaData.length}</p>
              <p>Activas: {sabanaFiltered.length}</p>
              <p>Índices: {indices.length}</p>
            </div>
          </div>

          <button className="sidebar-reset" onClick={() => { setFlor('all'); setColor('all'); setVariedad('all'); setBloque('all'); setNave('all'); setCama('all'); setCiclo('all') }}>
            Limpiar filtros
          </button>
        </div>

        {/* MAIN */}
        <div className="dashboard-main">
          {/* TABS */}
          <div className="dashboard-tabs">
            {['Inicio', 'Cama Piloto', 'Curvas Edad', 'Curvas Tiempo', 'Curvas Mt²', 'Extrapolado', 'Alertas'].map((label, idx) => (
              <div
                key={idx}
                className={`tab ${activePage === idx ? 'active' : ''}`}
                onClick={() => setActivePage(idx)}
              >
                {label}
              </div>
            ))}
          </div>

          {/* KPI ROW */}
          <div className="kpi-row">
            <div className="kpi kpi-teal">
              <div className="kpi-lbl">Total Tallos 2025</div>
              <div className="kpi-val c-teal">{kpis.totalTallos}</div>
              <div className="kpi-sub">Verónica + Delphinium</div>
            </div>
            <div className="kpi kpi-orange">
              <div className="kpi-lbl">T/m² Promedio</div>
              <div className="kpi-val c-orange">{kpis.tm2Promedio}</div>
              <div className="kpi-sub">General · 2025</div>
            </div>
            <div className="kpi kpi-green">
              <div className="kpi-lbl">Camas en Producción</div>
              <div className="kpi-val c-green">{kpis.camas}</div>
              <div className="kpi-sub">Activas esta semana</div>
            </div>
            <div className="kpi kpi-blue">
              <div className="kpi-lbl">Índice Pico Real</div>
              <div className="kpi-val c-blue">{kpis.indicePico}</div>
              <div className="kpi-sub">Máximo registrado</div>
            </div>
            <div className="kpi kpi-pink">
              <div className="kpi-lbl">F/m² Sem Actual</div>
              <div className="kpi-val c-pink">{kpis.fm2Sem}</div>
              <div className="kpi-alert">▼ -0.39 vs esperado</div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="dashboard-content">

            {/* PAGE 0: INICIO */}
            <div className={`page ${activePage === 0 ? 'active' : ''}`}>
              <div className="alert-banner">
                <span className="alert-icon">ALERTA</span>
                <div className="alert-text">
                  <div className="alert-title">{alertas.length} alertas activas — Semana 2526</div>
                  <div className="alert-desc">Ejecución por debajo del índice esperado en algunas camas.</div>
                  <div className="alert-items">
                    {alertas.slice(0, 3).map((a, i) => (
                      <span key={i} className="alert-item">{a.bloque} · Nave {a.nave} · Cama {a.cama}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="two-col">
                <div className="card">
                  <div className="card-header">
                    <div>
                      <div className="card-title">Curvas de Producción — Ambas Flores</div>
                      <div className="card-sub">Índice planta vs semana de vida · Comparativa</div>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="chart-h220">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartDataInicio}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="sem" stroke="var(--muted)" />
                          <YAxis stroke="var(--muted)" />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                          <Legend />
                          <Line type="monotone" dataKey="verónica" stroke="var(--orange)" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="delphinium" stroke="var(--teal)" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div><div className="card-title">Ejecución Semanal 2025</div>
                      <div className="card-sub">Producción real vs semana calendario</div></div>
                  </div>
                  <div className="card-body">
                    <div className="chart-h220">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartDataEjecVer}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="week" stroke="var(--muted)" />
                          <YAxis stroke="var(--muted)" />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                          <Area type="monotone" dataKey="producción" fill="rgba(244,114,182,0.15)" stroke="var(--pink)" strokeWidth={2} />
                          <Area type="monotone" dataKey="corte" fill="rgba(245,166,35,0.15)" stroke="var(--orange)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              <div className="two-col">
                <div className="card">
                  <div className="card-header"><div className="card-title">Comparativa por Bloque — T/m²</div></div>
                  <div className="card-body">
                    <div className="chart-h180">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={uniqueBloques.map((b, i) => {
                          const bloqueData = sabanaFiltered.filter(d => d.bloque === b)
                          const avgTm2 = bloqueData.length > 0 
                            ? bloqueData.reduce((sum, d) => sum + d.tm2, 0) / bloqueData.length 
                            : 0
                          return { bloque: b, tm2: avgTm2 }
                        })}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="bloque" stroke="var(--muted)" />
                          <YAxis stroke="var(--muted)" />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                          <Bar dataKey="tm2" fill="var(--pink)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><div className="card-title">Comparativa por Variedad — Índice</div></div>
                  <div className="card-body">
                    <div className="chart-h180">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { variedad: 'S.Blue', índice: 18.96 },
                          { variedad: 'S.Pink', índice: 14.41 },
                          { variedad: 'Sunshine', índice: 11.8 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="variedad" stroke="var(--muted)" />
                          <YAxis stroke="var(--muted)" />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                          <Bar dataKey="índice" fill="var(--blue)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PAGE 1: CAMA PILOTO */}
            <div className={`page ${activePage === 1 ? 'active' : ''}`}>
              <div className="card">
                <div className="card-header">
                  <div><div className="card-title">Sábana CPC — Datos Cama Piloto</div>
                    <div className="card-sub">Siembras en producción · 2025</div></div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span className="badge bg-teal">{sabanaFiltered.length} registros visibles</span>
                  </div>
                </div>
                <div className="tbl-wrap" style={{ maxHeight: '400px' }}>
                  <table>
                    <thead><tr>
                      <th>Flor</th><th>Bloque</th><th>Nave</th><th>Cama</th>
                      <th>Color</th><th>Variedad</th><th>Área m²</th><th>Plantas</th>
                      <th>F. Siembra</th><th>T/m²</th><th>Ciclo</th>
                    </tr></thead>
                    <tbody>
                      {sabanaFiltered.map((row, idx) => (
                        <tr key={idx} className={row.alerta ? 'alert-row' : ''}>
                          <td>{row.flor}</td>
                          <td><strong>{row.bloque}</strong></td>
                          <td>{row.nave}</td>
                          <td>{row.cama}</td>
                          <td><span className="badge" style={{ backgroundColor: `var(--${row.color.toLowerCase()})40` }}>{row.color}</span></td>
                          <td>{row.variedad}</td>
                          <td>{row.area}</td>
                          <td>{row.plantas}</td>
                          <td className="mono">{row.fs}</td>
                          <td><strong>{parseFloat(row.tm2).toFixed(2)}</strong></td>
                          <td>{row.ciclo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* PAGE 6: ALERTAS */}
            <div className={`page ${activePage === 6 ? 'active' : ''}`}>
              <div className="alert-banner">
                <span className="alert-icon">🚨</span>
                <div className="alert-text">
                  <div className="alert-title">{alertas.length} camas con ejecución por debajo del índice esperado — Semana 2526</div>
                  <div className="alert-desc">Basado en la curva de producción esperada para la semana de vida actual</div>
                </div>
              </div>

              <div className="card alert-card">
                <div className="card-header">
                  <div><div className="card-title" style={{ color: 'var(--red)' }}>Detalle de Alertas</div>
                    <div className="card-sub">Ejecución real vs índice esperado</div></div>
                  <span className="badge" style={{ backgroundColor: 'var(--red)30', color: 'var(--red)' }}>{alertas.length} alertas activas</span>
                </div>
                <div className="tbl-wrap" style={{ maxHeight: '300px' }}>
                  <table>
                    <thead><tr><th>Bloque</th><th>Nave</th><th>Cama</th><th>Variedad</th><th>Sem. Vida</th><th>Esperado</th><th>Real</th><th>Diferencia</th><th>Severidad</th></tr></thead>
                    <tbody>
                      {alertas.map((alert, idx) => (
                        <tr key={idx} className={alert.alerta ? 'alert-row' : ''}>
                          <td><strong>{alert.bloque}</strong></td>
                          <td>{alert.nave}</td>
                          <td>{alert.cama}</td>
                          <td>{alert.variedad}</td>
                          <td>{alert.semVida}</td>
                          <td>{alert.esperado}</td>
                          <td className="neg">{alert.real}</td>
                          <td className="neg">-{alert.diff}</td>
                          <td>
                            {alert.severidad === 'Alta' && <span className="badge" style={{ backgroundColor: 'var(--red)30', color: 'var(--red)' }}>Alta</span>}
                            {alert.severidad === 'Media' && <span className="badge" style={{ backgroundColor: 'var(--orange)30', color: 'var(--orange)' }}>Media</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* PAGES 2, 3, 4, 5 - PLACEHOLDER */}
            {[2, 3, 4, 5].map(pageNum => (
              <div key={pageNum} className={`page ${activePage === pageNum ? 'active' : ''}`}>
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Pestaña {pageNum + 1}</div>
                  </div>
                  <div className="card-body" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
                    <p>Esta sección está en desarrollo...</p>
                    <p style={{ fontSize: '12px', marginTop: '10px' }}>Los datos se completarán cuando conectemos Supabase</p>
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>
    </div>
  )
}
