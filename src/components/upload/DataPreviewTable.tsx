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
  // detect actual column keys for product/color/variedad (case/variant insensitive)
  const detectKey = (candidates: string[]) => keys.find(k => candidates.some(c => norm(k).includes(c)))
  const productKey = detectKey(['flor', 'producto', 'product']) || 'Flor'
  const colorKey = detectKey(['color', 'colores']) || 'Color'
  const variedadKey = detectKey(['var', 'variedad', 'variedades']) || 'Variedad'

  // default auto mapping: use header names first, then try to infer from sample values
  const autoMapping: Record<string, string | undefined> = {}
  targetFields.forEach((t) => {
    let found = keys.find((k) => norm(k) === norm(t) || norm(k).includes(norm(t)) || norm(t).includes(norm(k)))
    // fallback: map Producto -> Flor if present, Color/Variedad similarly
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
        const source = autoMapping[t] ?? (t === 'Producto' ? productKey : t === 'Color' ? colorKey : t === 'Variedad' ? variedadKey : undefined)
        if (source) out[t] = row[source]
      })
      return out
    })
    onMapped?.(mapped)
    // use stable dependency: comma-joined keys
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.join(',')])

  const applyMapping = () => {
    const mapped = data.map((row) => {
      const out: any = {}
      targetFields.forEach((t) => {
        const source = mapping[t] ?? (t === 'Producto' ? productKey : t === 'Color' ? colorKey : t === 'Variedad' ? variedadKey : undefined)
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
    data,
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
              // detect actual column keys for product/color/variedad (case/variant insensitive)
              const productKey = keys.find(k => {
                const nk = norm(k).replace(/\s+/g, '')
                return nk.includes('flor') || nk.includes('producto') || nk.includes('product')
              }) || 'Flor'
              const colorKey = keys.find(k => {
                const nk = norm(k).replace(/\s+/g, '')
                return nk.includes('color') || nk.includes('colores')
              }) || 'Color'
              const variedadKey = keys.find(k => {
                const nk = norm(k).replace(/\s+/g, '')
                return nk.includes('var') || nk.includes('variedad') || nk.includes('variedades')
              }) || 'Variedad'
              type Combo = { producto: string; color: string; variedad: string; count: number; sample: RowData[] }
              const map = new Map<string, Combo>()
              const extractProduct = (v: any) => {
                if (v == null) return ''
                const s = String(v).trim()
                if (!s) return ''
                // common separators: ' - ', ' — ', '–', ':'
                const sepMatch = s.match(/\s[-—–:\|]\s/)
                if (sepMatch) return s.split(sepMatch[0])[0].trim()
                // also allow ' -' or '- ' patterns
                if (s.includes(' - ')) return s.split(' - ')[0].trim()
                if (s.includes('—')) return s.split('—')[0].trim()
                if (s.includes('-')) return s.split('-')[0].trim()
                return s
              }

              for (const r of data) {
                const rawFlor = (r[productKey] ?? r['Flor'] ?? r['FLOR'] ?? '') as any
                const p = extractProduct(rawFlor)
                const c = (r[colorKey] ?? r['Color'] ?? r['COLOR'] ?? '') as any
                const v = (r[variedadKey] ?? r['Variedad'] ?? r['VARIEDAD'] ?? '') as any
                const key = `${norm(p)}||${norm(c)}||${norm(v)}`
                if (!map.has(key)) map.set(key, { producto: p, color: c, variedad: v, count: 0, sample: [] })
                const e = map.get(key)!
                e.count += 1
                if (e.sample.length < 2) e.sample.push(r)
              }
              const combos = Array.from(map.values()).sort((a, b) => b.count - a.count)

              // build product, color and variety option lists
              const products = Array.from(new Map(combos.map(c => [norm(c.producto), c.producto])).values())
              const colorsMap = combos.map(c => ({ producto: c.producto, color: c.color, key: `${norm(c.producto)}||${norm(c.color)}` }))
                .reduce((acc: Map<string, { producto: string; color: string }>, cur) => { if (!acc.has(cur.key)) acc.set(cur.key, { producto: cur.producto, color: cur.color }); return acc }, new Map())
              const colorsArr = Array.from(colorsMap.values())
              const varietiesMap = combos.map(c => ({ producto: c.producto, color: c.color, variedad: c.variedad, key: `${norm(c.producto)}||${norm(c.color)}||${norm(c.variedad)}` }))
                .reduce((acc: Map<string, { producto: string; color: string; variedad: string }>, cur) => { if (!acc.has(cur.key)) acc.set(cur.key, cur); return acc }, new Map())
              const varietiesArr = Array.from(varietiesMap.values())

              // component state
              const [selectedProducts, setSelectedProducts] = React.useState<Set<string>>(new Set())
              const [selectedColors, setSelectedColors] = React.useState<Set<string>>(new Set())
              const [selectedVarieties, setSelectedVarieties] = React.useState<Set<string>>(new Set())

              // derived lists filtered by selections
              const productList = products
              const colorList = colorsArr.filter((c: any) => selectedProducts.size === 0 || selectedProducts.has(norm(c.producto)))
              const varietyList = varietiesArr.filter((v: any) => {
                const prodMatch = selectedProducts.size === 0 || selectedProducts.has(norm(v.producto))
                const colorMatch = selectedColors.size === 0 || selectedColors.has(`${norm(v.producto)}||${norm(v.color)}`)
                return prodMatch && colorMatch
              })

              const toggleSet = (s: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) => {
                const next = new Set(s)
                if (next.has(key)) next.delete(key); else next.add(key)
                setFn(next)
              }

              return (
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <div className="font-medium mb-2">Productos</div>
                      <div className="h-48 max-h-48 overflow-auto border rounded p-2 pr-2">
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
                      <div className="h-48 max-h-48 overflow-auto border rounded p-2 pr-2">
                        {/* Group colors by producto for clarity */}
                        {(() => {
                          const groups = new Map<string, Array<{ producto: string; color: string }>>()
                          for (const c of colorsArr) {
                            const prod = c.producto || '(sin producto)'
                            const key = prod
                            if (!groups.has(key)) groups.set(key, [])
                            groups.get(key)!.push({ producto: c.producto, color: c.color })
                          }
                          return Array.from(groups.entries()).map(([prod, cols]) => (
                            <div key={prod} className="mb-2">
                              <div className="text-xs font-semibold text-gray-600 mb-1">{prod}</div>
                              <div className="pl-2">
                                {cols.map((c) => {
                                  const key = `${norm(c.producto)}||${norm(c.color)}`
                                  return (
                                    <label key={key} className="flex items-center gap-2 mb-1">
                                      <input type="checkbox" checked={selectedColors.has(key)} onChange={() => toggleSet(selectedColors, setSelectedColors, key)} />
                                      <div className="text-sm">{c.color || '(sin color)'}</div>
                                    </label>
                                  )
                                })}
                              </div>
                            </div>
                          ))
                        })()}
                        <div className="mt-2 flex gap-2">
                          <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={() => setSelectedColors(new Set(colorsArr.map((c: any) => `${norm(c.producto)}||${norm(c.color)}`)))}>Seleccionar todo</button>
                          <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={() => setSelectedColors(new Set())}>Limpiar</button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="font-medium mb-2">Variedades (por color & producto)</div>
                      <div className="h-48 max-h-48 overflow-auto border rounded p-2 pr-2">
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
                          <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={() => setSelectedVarieties(new Set(varietiesArr.map((v: any) => `${norm(v.producto)}||${norm(v.color)}||${norm(v.variedad)}`)))}>Seleccionar todo</button>
                          <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={() => setSelectedVarieties(new Set())}>Limpiar</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => {
                        // build mapped rows according to current mapping
                        const mappedAll = data.map((row) => {
                          const out: any = {}
                          targetFields.forEach((t) => {
                            const source = mapping[t]
                            if (source) out[t] = row[source]
                          })
                          return out
                        })

                        const filtered = mappedAll.filter((m) => {
                          const p = norm(m.Producto || m.Flor || '')
                          const c = norm(m.Color || '')
                          const v = norm(m.Variedad || '')
                          const prodOk = selectedProducts.size === 0 || selectedProducts.has(p)
                          const colorOk = selectedColors.size === 0 || selectedColors.has(`${p}||${c}`)
                          const varOk = selectedVarieties.size === 0 || selectedVarieties.has(`${p}||${c}||${v}`)
                          return prodOk && colorOk && varOk
                        })
                        onMapped?.(filtered)
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
      <div className="border border-gray-200 rounded-lg overflow-auto shadow-sm">
        <table className="w-full table-auto" style={{ minWidth: 1200 }}>
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
                    className="px-6 py-4 align-top text-sm text-gray-900 break-words"
                    style={{ maxWidth: 300 }}
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

