import { describe, it, expect } from 'vitest'
import { mapPdfError } from '@/lib/pdfOutline'

describe('pdf', () => {
  it('maps non-pdf to not-pdf note', () => {
    expect(mapPdfError({ code: 'not-pdf' })).toMatch(/not a pdf/i)
  })
  it('maps locked files', () => {
    expect(mapPdfError({ code: 'locked' })).toMatch(/locked/i)
  })
  it('maps cancel without throwing', () => {
    expect(mapPdfError({ code: 'cancelled' })).toMatch(/cancelled/i)
  })
}) 
