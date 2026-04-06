require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { createClient } = require('@supabase/supabase-js')
const { z } = require('zod')

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

const PORT = process.env.PORT || 4000
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Zod schema for a plano row
const PlanoRow = z.object({
  Bloque: z.string().min(1),
  Nave: z.string().min(1),
  Cama: z.string().min(1),
  AreaM2: z.preprocess((v) => Number(v), z.number().positive()).optional(),
  Producto: z.string().min(1),
  Color: z.string().min(1),
  Variedad: z.string().min(1),
  FechaSiembra: z.string().min(1),
  PlantasSembradas: z.preprocess((v) => Number(v), z.number().int().nonnegative()),
  Estado: z.string().optional(),
})

// POST /planos
app.post('/planos', async (req, res) => {
  const rows = Array.isArray(req.body) ? req.body : req.body.rows
  if (!rows || !Array.isArray(rows)) return res.status(400).json({ error: 'Se requiere un arreglo de filas' })

  const errors = []
  const valid = []

  rows.forEach((r, i) => {
    const parsed = PlanoRow.safeParse(r)
    if (!parsed.success) {
      errors.push({ index: i, issues: parsed.error.errors })
    } else {
      valid.push({ ...parsed.data, __idx: i })
    }
  })

  if (valid.length === 0) return res.status(400).json({ inserted: 0, errors })

  try {
    // Maps for created/found ids
    const bloqueMap = new Map()
    const naveMap = new Map()
    const camaMap = new Map()
    const productoMap = new Map()
    const colorMap = new Map()
    const variedadMap = new Map()

    // 1. bloques
    const bloques = Array.from(new Set(valid.map((v) => v.Bloque)))
    if (bloques.length) {
      const { data: existing } = await supabase.from('bloques').select('id_bloque,nombre').in('nombre', bloques)
      (existing || []).forEach((b) => bloqueMap.set(b.nombre, b.id_bloque))
      const missing = bloques.filter((b) => !bloqueMap.has(b)).map((nombre) => ({ nombre }))
      if (missing.length) {
        const { data: ins } = await supabase.from('bloques').insert(missing).select('id_bloque,nombre')
        (ins || []).forEach((b) => bloqueMap.set(b.nombre, b.id_bloque))
      }
    }

    // 2. naves
    const uniqueNaves = Array.from(new Set(valid.map((v) => `${v.Bloque}||${v.Nave}`))).map((s) => {
      const [bloque, nave] = s.split('||')
      return { bloque, nave }
    })
    for (const it of uniqueNaves) {
      const bloque_id = bloqueMap.get(it.bloque)
      const found = await supabase.from('naves').select('id_nave').match({ nombre: it.nave, id_bloque: bloque_id }).limit(1)
      if (found.data && found.data.length) {
        naveMap.set(`${it.bloque}||${it.nave}`, found.data[0].id_nave)
        continue
      }
      const { data: ins } = await supabase.from('naves').insert([{ nombre: it.nave, id_bloque: bloque_id }]).select('id_nave')
      naveMap.set(`${it.bloque}||${it.nave}`, ins[0].id_nave)
    }

    // 3. camas
    const uniqueCamas = Array.from(new Set(valid.map((v) => `${v.Bloque}||${v.Nave}||${v.Cama}`))).map((s) => {
      const [bloque, nave, cama] = s.split('||')
      return { bloque, nave, cama }
    })
    for (const it of uniqueCamas) {
      const naveKey = `${it.bloque}||${it.nave}`
      const id_nave = naveMap.get(naveKey)
      const found = await supabase.from('camas').select('id_cama').match({ nombre: it.cama, id_nave }).limit(1)
      if (found.data && found.data.length) {
        camaMap.set(`${it.bloque}||${it.nave}||${it.cama}`, found.data[0].id_cama)
        continue
      }
      const payload = { nombre: it.cama, id_nave, area_m2: null }
      const { data: ins } = await supabase.from('camas').insert([payload]).select('id_cama')
      camaMap.set(`${it.bloque}||${it.nave}||${it.cama}`, ins[0].id_cama)
    }

    // 4. productos/colores/variedades
    const productos = Array.from(new Set(valid.map((v) => v.Producto)))
    if (productos.length) {
      const { data: exist } = await supabase.from('productos').select('id_producto,nombre').in('nombre', productos)
      (exist || []).forEach((p) => productoMap.set(p.nombre, p.id_producto))
      const missing = productos.filter((p) => !productoMap.has(p)).map((nombre) => ({ nombre }))
      if (missing.length) {
        const { data: ins } = await supabase.from('productos').insert(missing).select('id_producto,nombre')
        (ins || []).forEach((p) => productoMap.set(p.nombre, p.id_producto))
      }
    }

    // colores
    const colores = Array.from(new Set(valid.map((v) => `${v.Producto}||${v.Color}`))).map((s) => {
      const [producto, color] = s.split('||')
      return { producto, color }
    })
    for (const it of colores) {
      const id_producto = productoMap.get(it.producto)
      const { data: found } = await supabase.from('colores').select('id_color').match({ nombre: it.color, id_producto }).limit(1)
      if (found && found.length) {
        colorMap.set(`${it.producto}||${it.color}`, found[0].id_color)
        continue
      }
      const { data: ins } = await supabase.from('colores').insert([{ nombre: it.color, id_producto }]).select('id_color')
      colorMap.set(`${it.producto}||${it.color}`, ins[0].id_color)
    }

    // variedades
    const variedades = Array.from(new Set(valid.map((v) => `${v.Producto}||${v.Color}||${v.Variedad}`))).map((s) => {
      const [producto, color, variedad] = s.split('||')
      return { producto, color, variedad }
    })
    for (const it of variedades) {
      const id_producto = productoMap.get(it.producto)
      const id_color = colorMap.get(`${it.producto}||${it.color}`)
      const { data: found } = await supabase.from('variedades').select('id_variedad').match({ nombre: it.variedad, id_color }).limit(1)
      if (found && found.length) {
        variedadMap.set(`${it.producto}||${it.color}||${it.variedad}`, found[0].id_variedad)
        continue
      }
      const { data: ins } = await supabase.from('variedades').insert([{ nombre: it.variedad, id_color }]).select('id_variedad')
      variedadMap.set(`${it.producto}||${it.color}||${it.variedad}`, ins[0].id_variedad)
    }

    // 5. prepare siembras payloads
    const siembras = []
    for (const v of valid) {
      const camaKey = `${v.Bloque}||${v.Nave}||${v.Cama}`
      const cama_id = camaMap.get(camaKey)
      const variedad_id = variedadMap.get(`${v.Producto}||${v.Color}||${v.Variedad}`)
      const fecha = new Date(v.FechaSiembra)
      if (!cama_id || !variedad_id || Number.isNaN(fecha.getTime())) {
        errors.push({ index: v.__idx, message: 'Falta referencia cama/variedad o fecha inválida' })
        continue
      }
      siembras.push({ id_cama: cama_id, id_variedad: variedad_id, fecha_siembra: fecha.toISOString().split('T')[0], plantas_sembradas: Number(v.PlantasSembradas), estado: v.Estado || 'EN PRODUCCION', creado_por: null })
    }

    // insert siembras
    if (siembras.length) {
      const { data: insSiembras, error: insErr } = await supabase.from('siembras').insert(siembras).select('id_siembra,id_cama,fecha_siembra')
      if (insErr) throw insErr
      // create ciclos for inserted siembras
      const ciclos = (insSiembras || []).map((s) => ({ id_siembra: s.id_siembra, numero_ciclo: 1, fecha_inicio: s.fecha_siembra, estado: 'ACTIVO' }))
      if (ciclos.length) {
        const { error: cErr } = await supabase.from('ciclos_produccion').insert(ciclos)
        if (cErr) throw cErr
      }
    }

    return res.json({ inserted: siembras.length, errors, details: { bloques: bloqueMap.size } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error interno', details: String(err) })
  }
})
// Basic root page and health
app.get('/', (req, res) => {
  res.send(`<html><body style="font-family: Arial, Helvetica, sans-serif; padding:20px">
    <h2>RDC Tandil SAS - Backend</h2>
    <p>POST <code>/planos</code> to insert planos de siembra.</p>
    <p>Example (curl):</p>
    <pre>curl -X POST http://localhost:${PORT}/planos -H "Content-Type: application/json" -d '[{"Bloque":"B1","Nave":"N1","Cama":"C1","Producto":"Rosa","Color":"Rojo","Variedad":"Rosa Roja","FechaSiembra":"2026-03-20","PlantasSembradas":100}]'</pre>
    <p><a href="/health">/health</a></p>
  </body></html>`)
})

app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' }))

app.listen(PORT, () => console.log(`RDC backend listening on ${PORT}`))
