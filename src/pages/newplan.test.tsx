import { it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NewPlan from '@/pages/NewPlan'
import { ToastProvider } from '@/components/Toast'
import { generatePlan } from '@/lib/generatePlan'

vi.mock('@/lib/generatePlan', () => ({
  generatePlan: vi.fn(),
  parseOutline: vi.fn(async () => null),
}))

it('requires subject, topics and deadline', () => {
  render(
    <MemoryRouter>
      <ToastProvider>
        <NewPlan />
      </ToastProvider>
    </MemoryRouter>
  )
  expect(screen.getByPlaceholderText(/biology/i)).toBeTruthy()
  expect(screen.getByLabelText(/exam date/i)).toBeTruthy()
})

it('ignores a rapid second generate submit while busy', async () => {
  const mocked = vi.mocked(generatePlan)
  mocked.mockReset()
  mocked.mockImplementation(
    () => new Promise(() => {}) as unknown as ReturnType<typeof generatePlan>
  )
  render(
    <MemoryRouter>
      <ToastProvider>
        <NewPlan />
      </ToastProvider>
    </MemoryRouter>
  )
  fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: 'Biology' } })
  fireEvent.change(screen.getByLabelText(/topics/i), { target: { value: 'Cells\nGenetics' } })
  fireEvent.change(screen.getByLabelText(/exam date/i), { target: { value: '2026-12-31' } })
  const form = document.querySelector('form')
  if (!form) throw new Error('form not found')
  fireEvent.submit(form)
  await screen.findByText(/building your plan/i)
  fireEvent.submit(form)
  expect(mocked).toHaveBeenCalledTimes(1)
}) 
