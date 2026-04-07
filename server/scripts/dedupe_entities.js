require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const norm = (s) => (s == null ? '' : String(s).trim().replace(/\s+/g, ' ').toLowerCase())

async function groupByNorm(rows, keyFn) {
  const map = new Map()
  for (const r of rows) {
    const key = norm(keyFn(r))
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(r)
  }
  return map
}

async function dedupeProductos(dryRun = true) {
  console.log('Scanning productos...')
  const { data: productos } = await supabase.from('productos').select('id_producto,nombre')
  const groups = await groupByNorm(productos, r => r.nombre)
  let merged = 0
  for (const [k, group] of groups) {
    if (group.length < 2) continue
    group.sort((a,b)=>a.id_producto - b.id_producto)
    const canonical = group[0]
    const dups = group.slice(1)
    console.log(`Producto "${canonical.nombre}" has ${dups.length} duplicates`)
    for (const d of dups) {
      console.log(` - will merge id ${d.id_producto} -> ${canonical.id_producto}`)
      if (!dryRun) {
        // reassign colores
        const { error: e1 } = await supabase.from('colores').update({ id_producto: canonical.id_producto }).eq('id_producto', d.id_producto)
        if (e1) { console.error('Failed updating colores for producto', d.id_producto, e1); continue }
        const { error: e2 } = await supabase.from('productos').delete().eq('id_producto', d.id_producto)
        if (e2) { console.error('Failed deleting producto', d.id_producto, e2); continue }
      }
      merged++
    }
  }
  return merged
}

async function dedupeColores(dryRun = true) {
  console.log('Scanning colores...')
  const { data: colores } = await supabase.from('colores').select('id_color,nombre,id_producto')
  // group by id_producto + normalized nombre
  const map = new Map()
  for (const c of colores) {
    const key = `${c.id_producto}||${norm(c.nombre)}`
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(c)
  }
  let merged = 0
  for (const [k, group] of map.entries()) {
    if (group.length < 2) continue
    group.sort((a,b)=>a.id_color - b.id_color)
    const canonical = group[0]
    const dups = group.slice(1)
    console.log(`Color "${canonical.nombre}" (producto ${canonical.id_producto}) has ${dups.length} duplicates`)
    for (const d of dups) {
      console.log(` - will merge id ${d.id_color} -> ${canonical.id_color}`)
      if (!dryRun) {
        // reassign variedades
        const { error: e1 } = await supabase.from('variedades').update({ id_color: canonical.id_color }).eq('id_color', d.id_color)
        if (e1) { console.error('Failed updating variedades for color', d.id_color, e1); continue }
        const { error: e2 } = await supabase.from('colores').delete().eq('id_color', d.id_color)
        if (e2) { console.error('Failed deleting color', d.id_color, e2); continue }
      }
      merged++
    }
  }
  return merged
}

async function dedupeVariedades(dryRun = true) {
  console.log('Scanning variedades...')
  const { data: variedades } = await supabase.from('variedades').select('id_variedad,nombre,id_color')
  const map = new Map()
  for (const v of variedades) {
    const key = `${v.id_color}||${norm(v.nombre)}`
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(v)
  }
  let merged = 0
  for (const [k, group] of map.entries()) {
    if (group.length < 2) continue
    group.sort((a,b)=>a.id_variedad - b.id_variedad)
    const canonical = group[0]
    const dups = group.slice(1)
    console.log(`Variedad "${canonical.nombre}" (color ${canonical.id_color}) has ${dups.length} duplicates`)
    for (const d of dups) {
      console.log(` - will merge id ${d.id_variedad} -> ${canonical.id_variedad}`)
      if (!dryRun) {
        // reassign siembras
        const { error: e1 } = await supabase.from('siembras').update({ id_variedad: canonical.id_variedad }).eq('id_variedad', d.id_variedad)
        if (e1) { console.error('Failed updating siembras for variedad', d.id_variedad, e1); continue }
        const { error: e2 } = await supabase.from('variedades').delete().eq('id_variedad', d.id_variedad)
        if (e2) { console.error('Failed deleting variedad', d.id_variedad, e2); continue }
      }
      merged++
    }
  }
  return merged
}

async function main() {
  const dryRun = process.argv.includes('--dry') || process.argv.includes('--dry-run')
  console.log(dryRun ? 'DRY RUN mode - no updates will be performed' : 'LIVE mode - will perform updates/deletes')
  const r1 = await dedupeProductos(dryRun)
  console.log(`Productos merged: ${r1}`)
  const r2 = await dedupeColores(dryRun)
  console.log(`Colores merged: ${r2}`)
  const r3 = await dedupeVariedades(dryRun)
  console.log(`Variedades merged: ${r3}`)
  console.log('Done.')
}

main().catch(e => { console.error(e); process.exit(1) })
