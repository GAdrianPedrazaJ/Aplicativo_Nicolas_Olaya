#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error('Usage: node scripts/reproduce_upload.js <file.{csv|xlsx|xls}> [backendUrl]')
    process.exit(1)
  }
  const file = args[0]
  const backend = args[1] || process.env.BACKEND_URL || 'http://localhost:4000'
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

  const theFetch = globalThis.fetch || (await import('node-fetch')).default
  const res = await theFetch(backend + '/planos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  const body = await res.text()
  console.log('Status:', res.status)
  console.log('Response:', body)
}

main().catch(err => { console.error(err); process.exit(99) })
