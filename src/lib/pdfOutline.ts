export type PdfErrorCode = 'not-pdf' | 'locked' | 'empty' | 'cdn' | 'cancelled' | 'too-big' | 'failed'

export interface CancelToken {
  current: boolean
}

const MESSAGES: Record<PdfErrorCode, string> = {
  'not-pdf': 'That is not a PDF. The outline must be a PDF file.',
  locked: 'This PDF is locked. Unlock it first, or type the topics by hand.',
  empty: 'No readable pages found. Type the topics by hand.',
  cdn: 'Reader could not load. Check connection and try again.',
  cancelled: 'Cancelled. Type the topics by hand or try a smaller file.',
  'too-big': 'File is over the device limit. Re-save with fewer pages and try again.',
  failed: 'Could not read the outline. Type the topics by hand.'
}

export function mapPdfError(e: { code?: string } | null | undefined): string {
  const code = (e?.code || 'failed') as PdfErrorCode
  return MESSAGES[code] || MESSAGES.failed
}

const PDFJS_VERSION = '3.11.174'
const PDFJS_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`
const WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`

export const MAX_TEXT = 15000

export function deviceCap() {
  const coarse =
    (typeof window !== 'undefined' && (window as any).matchMedia?.('(pointer: coarse)').matches) ||
    (typeof screen !== 'undefined' && Math.min(screen.width, screen.height) < 768)
  return coarse
    ? { bytes: 15 * 1024 * 1024, pages: 100, label: 'phone' }
    : { bytes: 50 * 1024 * 1024, pages: 300, label: 'laptop' }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve()
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('cdn failed'))
    document.head.appendChild(s)
  })
}

let pdfjsPromise: Promise<any> | null = null
export function getPdfJs(): Promise<any> {
  if (!pdfjsPromise) {
    pdfjsPromise = loadScript(PDFJS_URL).then(() => {
      const lib = (window as any).pdfjsLib
      if (!lib) throw new Error('cdn failed')
      lib.GlobalWorkerOptions.workerSrc = WORKER_URL
      return lib
    })
  }
  return pdfjsPromise
}

export type OutlineResult =
  | { mode: 'text'; text: string; pagesUsed: number; totalPages: number }
  | { mode: 'images'; images: string[]; totalPages: number }

export async function readOutline(
  file: File,
  opts: { onProgress?: (page: number, total: number) => void; cancelled?: CancelToken } = {}
): Promise<OutlineResult> {
  const cap = deviceCap()
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer())
  const isPdf = String.fromCharCode(...head) === '%PDF-'
  if (!isPdf) throw { code: 'not-pdf' }
  if (file.size > cap.bytes) throw { code: 'too-big', cap }

  let lib: any
  try {
    lib = await getPdfJs()
  } catch {
    throw { code: 'cdn' }
  }

  let pdf: any
  try {
    const buf = await file.arrayBuffer()
    pdf = await lib.getDocument({ data: new Uint8Array(buf) }).promise
  } catch (e: any) {
    if (e && (e.name === 'PasswordException' || /password/i.test(e.message || ''))) {
      throw { code: 'locked' }
    }
    throw { code: 'empty' }
  }

  try {
    const totalPages: number = pdf.numPages
    const limit = Math.min(totalPages, cap.pages)
    const allLines: { text: string; size: number; bold: boolean }[] = []
    let header: string[] = []
    let pagesRead = 0
    for (let p = 1; p <= limit; p++) {
      if (opts.cancelled?.current) throw { code: 'cancelled' }
      const page = await pdf.getPage(p)
      const content = await page.getTextContent()
      const lines = groupLines(content.items)
      if (p === 1) header = lines.slice(0, 8).map((l) => l.text)
      allLines.push(...lines)
      if (typeof page.cleanup === 'function') page.cleanup()
      pagesRead = p
      opts.onProgress?.(p, totalPages)
      const gathered = allLines.reduce((a, l) => a + l.text.length, 0)
      if (gathered > MAX_TEXT && p >= 3) break
    }

    const headings = sieve(allLines)
    if (headings.length >= 3) {
      const text = `HEADER:\n${header.join('\n')}\nHEADINGS:\n${headings.map((h) => `- ${h}`).join('\n')}`.slice(0, MAX_TEXT)
      return { mode: 'text', text, pagesUsed: pagesRead, totalPages }
    }

    const images: string[] = []
    for (let p = 1; p <= Math.min(totalPages, 3); p++) {
      if (opts.cancelled?.current) throw { code: 'cancelled' }
      const page = await pdf.getPage(p)
      const viewport = page.getViewport({ scale: 1 })
      const scale = Math.min(1.5, 768 / viewport.width)
      const v = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(v.width)
      canvas.height = Math.floor(v.height)
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: v }).promise
      images.push(canvas.toDataURL('image/jpeg', 0.7))
      canvas.width = 0
      if (typeof page.cleanup === 'function') page.cleanup()
    }
    if (images.length === 0) throw { code: 'empty' }
    return { mode: 'images', images, totalPages }
  } finally {
    try {
      await pdf.destroy()
    } catch {
      /* already gone */
    }
  }
}

interface PdfItem {
  str: string
  transform: number[]
  fontName?: string
}

function groupLines(items: PdfItem[]) {
  const rows = new Map<number, { text: string; size: number; bold: boolean }>()
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue
    const y = Math.round(it.transform[5])
    const size = Math.abs(it.transform[3]) || 0
    const bold = /bold|black|demi|heavy/i.test(it.fontName || '')
    if (!rows.has(y)) rows.set(y, { text: '', size: 0, bold: false })
    const row = rows.get(y)!
    row.text += it.str
    row.size = Math.max(row.size, size)
    row.bold = row.bold || bold
  }
  return [...rows.values()]
    .map((r) => ({ ...r, text: r.text.replace(/\s+/g, ' ').trim() }))
    .filter((r) => r.text.length > 0)
}

function sieve(allLines: { text: string; size: number; bold: boolean }[]) {
  const HEAD_PATTERN = /^(week|chapter|topic|unit|module|part|section|lesson)\b/i
  const NUM_PATTERN = /^\d{1,2}([.\)]\s|:)/
  const freq: Record<number, number> = {}
  for (const l of allLines) {
    const k = Math.round(l.size) || 0
    freq[k] = (freq[k] || 0) + l.text.length
  }
  let body = 0
  let best = -1
  for (const k of Object.keys(freq)) {
    if (freq[Number(k)] > best) {
      best = freq[Number(k)]
      body = Number(k)
    }
  }
  const seen = new Set<string>()
  const out: string[] = []
  for (const l of allLines) {
    const t = l.text
    if (t.length < 3 || t.length > 200 || seen.has(t.toLowerCase())) continue
    const caps = t.length > 3 && /[A-Z]/.test(t) && t === t.toUpperCase()
    const head =
      (body > 0 && l.size >= body * 1.15) ||
      l.bold ||
      caps ||
      HEAD_PATTERN.test(t) ||
      NUM_PATTERN.test(t)
    if (head) {
      seen.add(t.toLowerCase())
      out.push(t)
      if (out.length >= 200) break
    }
  }
  return out
} 
