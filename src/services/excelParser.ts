import { z } from 'zod'
import Papa from 'papaparse'

export async function parseCsv(file: File) {
  return new Promise<any[]>((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data as any[]),
      error: (err) => reject(err),
    })
  })
}
