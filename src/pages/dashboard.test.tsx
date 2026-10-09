import { it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '@/pages/Dashboard'
import { ToastProvider } from '@/components/Toast'

// supabase-js binds fetch at import, so stubbing global fetch cannot force
// the offline path. Mock the store boundary instead: the component talks to
// demoStore, which is the same fallback production uses when unreachable.
vi.mock('@/lib/store', async () => {
  const actual = (await vi.importActual('@/lib/store')) as Record<string, any>
  return { ...actual, store: { ...actual.demoStore, mode: 'demo' } }
})

beforeEach(() => {
  localStorage.clear()
})

it('shows empty state with no plans', async () => {
  render(
    <MemoryRouter>
      <ToastProvider>
        <Dashboard />
      </ToastProvider>
    </MemoryRouter>
  )
  expect(await screen.findByText(/no plans yet/i)).toBeTruthy()
})

it('lists a seeded plan', async () => {
  localStorage.setItem(
    'ps1:plans',
    JSON.stringify([
      {
        id: 'seed-1',
        subject: 'Bio',
        topics: 'Cells',
        deadline: '2026-12-01',
        hours_per_day: 2,
        plan_json: [{ id: 'a', title: 'Study Cells', date: '2026-10-01', duration_min: 30, done: true }],
        created_at: new Date().toISOString()
      }
    ])
  )
  render(
    <MemoryRouter>
      <ToastProvider>
        <Dashboard />
      </ToastProvider>
    </MemoryRouter>
  )
  expect(await screen.findByText('Bio')).toBeTruthy()
}) 
