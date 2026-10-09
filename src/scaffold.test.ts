import { describe, it, expect } from 'vitest'
import { isSupabaseConfigured } from '@/lib/supabaseClient'

describe('scaffold', () => {
  it('exposes supabase gate', () => {
    expect(typeof isSupabaseConfigured).toBe('boolean')
  })
})  
