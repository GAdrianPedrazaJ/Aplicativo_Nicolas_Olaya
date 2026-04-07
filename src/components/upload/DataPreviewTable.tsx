import React from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'

type RowData = Record<string, unknown>

const columnHelper = createColumnHelper<RowData>()

export default function DataPreviewTable({ data, onMapped }: { data: RowData[], onMapped?: (mapped: RowData[]) => void }) {
  if (!data || data.length === 0) return <div className="text-sm text-gray-500 p-8 text-center">No hay datos cargados.</div>

  const keys = Array.from(new Set(data.flatMap((r) => Object.keys(r))))

  // Fields we expect to map to
  const targetFields = [
    'Bloque', 'Nave', 'Cama', 'Producto', 'Color', 'Variedad', 'FechaSiembra', 'PlantasSembradas', 'AreaM2', 'Estado'
  ]

  // helper: normalize header for matching
  const norm = (s: string) => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, '').replace(/[_-]/g, '').toLowerCase()

  // helper: extract product name from combined 'Flor' values
  const extractProduct = (v: any) => {
    if (v == null) return ''
    const s = String(v).trim()
    if (!s) return ''
    const sepMatch = s.match(/\s[-—–:\|]\s/)
    if (sepMatch) return s.split(sepMatch[0])[0].trim()
    if (s.includes(' - ')) return s.split(' - ')[0].trim()
    if (s.includes('—')) return s.split('—')[0].trim()
    if (s.includes('-')) return s.split('-')[0].trim()
    return s
  }

  // detect actual column keys for product/color/variedad (case/variant insensitive)
  const detectKey = (candidates: string[]) => keys.find(k => candidates.some(c => norm(k).includes(c)))
  const productKey = detectKey(['flor', 'producto', 'product']) || 'Flor'
  const colorKey = detectKey(['color', 'colores']) || 'Color'
  const variedadKey = detectKey(['var', 'variedad', 'variedades']) || 'Variedad'

  // default auto mapping: use header names first, then try to infer from sample values
  const autoMapping: Record<string, string | undefined> = {}
  targetFields.forEach((t) => {
    let found = keys.find((k) => norm(k) === norm(t) || norm(k).includes(norm(t)) || norm(t).includes(norm(k)))
    if (!found) {
      if (t === 'Producto') found = productKey
      if (t === 'Color') found = colorKey
      if (t === 'Variedad') found = variedadKey
    }
    if (found) autoMapping[t] = found
    else autoMapping[t] = undefined
  })

  // If FechaSiembra (or other fields) not found by header, try infer by sample values
  const inferFromValues = () => {
    if (!data || data.length === 0) return
    const sampleSize = Math.min(10, data.length)
    const sampleRows = data.slice(0, sampleSize)

    // helper: is date-like
    const isDateLike = (v: any) => {
      if (v == null) return false
      const s = String(v).trim()
      if (!s) return false
      // ISO date
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return true
      // slashed dates dd/mm/yyyy or mm/dd/yyyy
      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)) return true
      // excel serial-ish numeric values (between 20000 and 46000)
      if (/^\d+$/.test(s)) {
        const n = Number(s)
        if (n > 20000 && n < 50000) return true
      }
      return false
    }

    // check each key for date-like values
    for (const k of keys) {
      if (autoMapping['FechaSiembra']) break
      let count = 0
      for (const r of sampleRows) {
        if (isDateLike(r[k])) count++
      }
      // if majority of sample rows look like dates, choose this column
      if (count >= Math.max(1, Math.floor(sampleSize * 0.6))) {
        autoMapping['FechaSiembra'] = k
      }
    }
  }
  inferFromValues()

  const [mapping, setMapping] = React.useState<Record<string, string | undefined>>(autoMapping)

  // When headers/keys change, reapply auto-mapping so fields like FechaSiembra get detected
  React.useEffect(() => {
    setMapping(autoMapping)
    // apply mapping automatically to parent so mappedData isn't empty by accident
    const mapped = data.map((row) => {
      const out: any = {}
      targetFields.forEach((t) => {
        const source = autoMapping[t]
        if (source) out[t] = row[source]
      })
      return out
    })
    onMapped?.(mapped)
    // use stable dependency: comma-joined keys
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.join(',')])

  // visibleData: the rows currently shown in the table (affected by filters)
  const [visibleData, setVisibleData] = React.useState<RowData[]>(data)
  React.useEffect(() => setVisibleData(data), [data])

  const applyMapping = () => {
    const mapped = data.map((row) => {
      const out: any = {}
      targetFields.forEach((t) => {
        const source = mapping[t]
        if (source) out[t] = row[source]
      })
      return out
    })
    onMapped?.(mapped)
  }

  const columns = React.useMemo(() => keys.map((header) =>
    columnHelper.accessor(header as keyof RowData, {
      id: header,
      header,
      cell: (info) => String(info.getValue() ?? ''),
    })
  ), [keys])

  const table = useReactTable({
    data: visibleData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <div className="w-full">
          {/* Dependent filters: Producto -> Colores -> Variedades */}
          <div className="mb-4">
            {(() => {
              const norm = (s: any) => (s == null ? '' : String(s).trim().toLowerCase().replace(/\s+/g, ' '))
              type Combo = { producto: string; color: string; variedad: string; count: number; sample: RowData[] }
              const map = new Map<string, Combo>()
              for (const r of data) {
                const raw = (r[productKey] ?? r['Flor'] ?? '') as any
                const p = extractProduct(raw)
                const c = (r[colorKey] ?? r['Color'] ?? '') as string
                const v = (r[variedadKey] ?? r['Variedad'] ?? '') as string
                const key = `${norm(p)}||${norm(c)}||${norm(v)}`
                if (!map.has(key)) map.set(key, { producto: p, color: c, variedad: v, count: 0, sample: [] })
                const e = map.get(key)!
                e.count += 1
                if (e.sample.length < 2) e.sample.push(r)
              }
              const combos = Array.from(map.values()).sort((a, b) => b.count - a.count)

              // build product, color and variety option lists
              const products = Array.from(new Map(combos.map(c => [norm(c.producto), c.producto])).values())
              const colors = combos.map(c => ({ producto: c.producto, color: c.color, key: `${norm(c.producto)}||${norm(c.color)}` }))
                .reduce((acc: Map<string, { producto: string; color: string }>, cur) => { if (!acc.has(cur.key)) acc.set(cur.key, { producto: cur.producto, color: cur.color }); return acc }, new Map()).values()
              const varieties = combos.map(c => ({ producto: c.producto, color: c.color, variedad: c.variedad, key: `${norm(c.producto)}||${norm(c.color)}||${norm(c.variedad)}` }))
                .reduce((acc: Map<string, { producto: string; color: string; variedad: string }>, cur) => { if (!acc.has(cur.key)) acc.set(cur.key, cur); return acc }, new Map()).values()

              // component state
              const [selectedProducts, setSelectedProducts] = React.useState<Set<string>>(new Set())
              const [selectedColors, setSelectedColors] = React.useState<Set<string>>(new Set())
              const [selectedVarieties, setSelectedVarieties] = React.useState<Set<string>>(new Set())

              // derived lists filtered by selections
              const productList = products
              const colorList = Array.from(colors).filter((c: any) => selectedProducts.size === 0 || selectedProducts.has(norm(c.producto)))
              const varietyList = Array.from(varieties).filter((v: any) => {
                const prodMatch = selectedProducts.size === 0 || selectedProducts.has(norm(v.producto))
                const colorMatch = selectedColors.size === 0 || selectedColors.has(`${norm(v.producto)}||${norm(v.color)}`)
                return prodMatch && colorMatch
              })

              const toggleSet = (s: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) => {
                const next = new Set(s)
                if (next.has(key)) next.delete(key); else next.add(key)
                setFn(next)
              }

              // whenever selections change, compute filtered visible data and notify parent
              React.useEffect(() => {
                const filtered = data.filter((row) => {
                  const raw = (row[productKey] ?? row['Flor'] ?? '') as any
                  const p = norm(extractProduct(raw))
                  const c = norm((row[colorKey] ?? row['Color'] ?? '') as any)
                  const v = norm((row[variedadKey] ?? row['Variedad'] ?? '') as any)
                  const prodOk = selectedProducts.size === 0 || selectedProducts.has(p)
                  const colorOk = selectedColors.size === 0 || selectedColors.has(`${p}||${c}`)
                  const varOk = selectedVarieties.size === 0 || selectedVarieties.has(`${p}||${c}||${v}`)
                  return prodOk && colorOk && varOk
                })
                setVisibleData(filtered)
                // send mapped payload for the filtered rows
                const mappedFiltered = filtered.map((row) => {
                  const out: any = {}
                  targetFields.forEach((t) => {
                    const source = mapping[t] ?? (t === 'Producto' ? productKey : t === 'Color' ? colorKey : t === 'Variedad' ? variedadKey : undefined)
                    if (source) out[t] = row[source]
                  })
                  return out
                })
                onMapped?.(mappedFiltered)
              }, [Array.from(selectedProducts).join(','), Array.from(selectedColors).join(','), Array.from(selectedVarieties).join(',')])

              return (
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <div className="font-medium mb-2">Productos</div>
                      <div className="max-h-40 overflow-auto border rounded p-2">
                        {productList.map((p: string) => (
                          <label key={p} className="flex items-center gap-2 mb-1">
                            <input type="checkbox" checked={selectedProducts.has(norm(p))} onChange={() => toggleSet(selectedProducts, setSelectedProducts, norm(p))} />
                            <div className="text-sm">{p || '(sin producto)'}</div>
                          </label>
                        ))}
                        <div className="mt-2 flex gap-2">
                          <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={() => setSelectedProducts(new Set(productList.map((p: string) => norm(p))))}>Seleccionar todo</button>
                          <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={() => setSelectedProducts(new Set())}>Limpiar</button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="font-medium mb-2">Colores (por producto)</div>
                      <div className="max-h-40 overflow-auto border rounded p-2">
                        {colorList.map((c: any) => {
                          const key = `${norm(c.producto)}||${norm(c.color)}`
                          return (
                            <label key={key} className="flex items-center gap-2 mb-1">
                              <input type="checkbox" checked={selectedColors.has(key)} onChange={() => toggleSet(selectedColors, setSelectedColors, key)} />
                              <div className="text-sm">
                                <div>{c.color || '(sin color)'}</div>
                                <div className="text-xs text-gray-500">{c.producto || '(sin producto)'}</div>
                              </div>
                            </label>
                          )
                        })}
                        <div className="mt-2 flex gap-2">
                          <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={() => setSelectedColors(new Set(Array.from(colors).map((c: any) => `${norm(c.producto)}||${norm(c.color)}`)))}>Seleccionar todo</button>
                          <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={() => setSelectedColors(new Set())}>Limpiar</button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="font-medium mb-2">Variedades (por color & producto)</div>
                      <div className="max-h-40 overflow-auto border rounded p-2">
                        {varietyList.map((v: any) => {
                          const key = `${norm(v.producto)}||${norm(v.color)}||${norm(v.variedad)}`
                          return (
                            <label key={key} className="flex items-center gap-2 mb-1">
                              <input type="checkbox" checked={selectedVarieties.has(key)} onChange={() => toggleSet(selectedVarieties, setSelectedVarieties, key)} />
                              <div className="text-sm">
                                <div>{v.variedad || '(sin variedad)'}</div>
                                <div className="text-xs text-gray-500">{v.color || '(sin color)'} • {v.producto || '(sin producto)'}</div>
                              </div>
                            </label>
                          )
                        })}
                        <div className="mt-2 flex gap-2">
                          <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={() => setSelectedVarieties(new Set(Array.from(varieties).map((v: any) => `${norm(v.producto)}||${norm(v.color)}||${norm(v.variedad)}`)))}>Seleccionar todo</button>
                          <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={() => setSelectedVarieties(new Set())}>Limpiar</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between items-center">
                    <button
                      onClick={() => {
                        // clear all selections and restore full view
                        setSelectedProducts(new Set())
                        setSelectedColors(new Set())
                        setSelectedVarieties(new Set())
                        setVisibleData(data)
                        const fullMapped = data.map((row) => {
                          const out: any = {}
                          targetFields.forEach((t) => {
                            const source = mapping[t] ?? (t === 'Producto' ? productKey : t === 'Color' ? colorKey : t === 'Variedad' ? variedadKey : undefined)
                            if (source) out[t] = row[source]
                          })
                          return out
                        })
                        onMapped?.(fullMapped)
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
                    >Limpiar filtros</button>

                    <button
                      onClick={() => {
                        // explicit apply: send current visible mapped rows
                        const mapped = visibleData.map((row) => {
                          const out: any = {}
                          targetFields.forEach((t) => {
                            const source = mapping[t] ?? (t === 'Producto' ? productKey : t === 'Color' ? colorKey : t === 'Variedad' ? variedadKey : undefined)
                            if (source) out[t] = row[source]
                          })
                          return out
                        })
                        onMapped?.(mapped)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                    >Aplicar selección</button>
                  </div>
                </div>
              )
            })()}
          </div>

      {/* Search */}
      <div className="mb-4">
        <input
          placeholder="Buscar en datos..."
          value={(table.getState().globalFilter ?? '') as string}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th 
                    key={header.id}
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: ' 🔼',
                      desc: ' 🔽',
                    }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr 
                key={row.id}
                className="hover:bg-gray-50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td 
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center">
            <span className="text-sm text-gray-700">
              Página <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span> de <span className="font-medium">{table.getPageCount()}</span>
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="w-12 h-10 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center"
            >
              {'<'}
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="w-12 h-10 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center"
            >
              {'>'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

