#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')

async function main() {
  const args = process.argv.slice(2)
  // flags: --unique-variedad | -u
  const uniqueVarFlag = args.includes('--unique-variedad') || args.includes('-u')
  // backend URL can be provided as second arg or via env
  const backend = args.find(a => a.startsWith('http')) || args[1] || process.env.BACKEND_URL || 'http://localhost:4000'

  let file = args[0]
  // If no file provided, try to auto-detect a spreadsheet in the repo root
  if (!file) {
    const candidates = fs.readdirSync(process.cwd()).filter(f => f.match(/\.(xlsx|xls|csv)$/i))
    if (candidates.length > 0) {
      file = candidates[0]
      console.log('Auto-detected file:', file)
    }
  }

  if (!file) {
    console.error('Usage: node scripts/reproduce_upload.js <file.{csv|xlsx|xls}> [backendUrl]')
    process.exit(1)
  }

  if (!fs.existsSync(file)) {
    console.error('File not found:', file)
    process.exit(2)
  }

  const ext = path.extname(file).toLowerCase()
  let data = []
  if (ext === '.csv') {
    const txt = fs.readFileSync(file, 'utf8')
    const rows = txt.split(/\r?\n/).filter(Boolean)
    const headers = rows.shift().split(/,/) 
    data = rows.map(r => {
      const cols = r.split(/,/) 
      const obj = {}
      headers.forEach((h, i) => obj[h.trim()] = (cols[i] || '').trim())
      return obj
    })
  } else {
    const wb = XLSX.readFile(file)
    const sheet = wb.SheetNames[0]
    data = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: '' })
  }

  console.log('Parsed rows:', data.length)
  if (data.length === 0) process.exit(0)

  // If requested, reduce rows to one per unique Producto+Color+Variedad
  if (uniqueVarFlag) {
    const norm = (s) => (s == null ? '' : String(s).trim().toLowerCase().replace(/\s+/g, ' '))
    const seen = new Set()
    const reduced = []
    for (const r of data) {
      const key = `${norm(r.Producto || r.Flor || '')}||${norm(r.Color)}||${norm(r.Variedad)}`
      if (!seen.has(key)) {
        seen.add(key)
        reduced.push(r)
      }
    }
    console.log(`Deduplicated rows by Producto+Color+Variedad: ${data.length} -> ${reduced.length}`)
    data = reduced
  }

  // Show a small sample of the payload for debugging
  console.log('Payload sample (first 3 rows):', JSON.stringify(data.slice(0, 3), null, 2))

  const theFetch = globalThis.fetch || (await import('node-fetch')).default
  const res = await theFetch(backend + '/planos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch (err) {
    body = text
  }

  console.log('Status:', res.status)
  console.log('Response body:', typeof body === 'string' ? body : JSON.stringify(body, null, 2))
  if (body && body.inserted !== undefined) {
    console.log(`Inserted: ${body.inserted} / ${data.length} rows (${Math.round((body.inserted / data.length) * 100)}%)`)
  }
  if (body && Array.isArray(body.errors) && body.errors.length) {
    console.log('Errors (first 5):', JSON.stringify(body.errors.slice(0,5), null, 2))
  }
}

main().catch(err => { console.error(err); process.exit(99) })
