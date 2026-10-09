import { it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WeeklySummary from '@/components/WeeklySummary'
import { todayISO } from '@/lib/dates'

function plans() {
  const today = todayISO()
  return [
    {
      id: 'p1',
      subject: 'Bio',
      topics: 'Cells',
      deadline: '2026-12-01',
      hours_per_day: 2,
      plan_json: [{ id: 'a', title: 'Study Cells', date: today, duration_min: 30, done: false }]
    }
  ]
}

beforeEach(() => {
  localStorage.clear()
})

it('announces the summary when ready and expands on view', async () => {
  render(<WeeklySummary plans={plans()} />)
  expect(await screen.findByText(/summary is ready/i)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: /view/i }))
  expect(await screen.findByText('Cells')).toBeTruthy()
})

it('renders nothing when the week is empty', () => {
  const { container } = render(<WeeklySummary plans={[]} />)
  expect(container.firstChild).toBeNull()
})

it('retracts and expands the card body', async () => {
  render(<WeeklySummary plans={plans()} />)
  fireEvent.click(screen.getByRole('button', { name: /view/i }))
  expect(await screen.findByText('Cells')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: /retract summary/i }))
  expect(screen.queryByText('Cells')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: /expand summary/i }))
  expect(await screen.findByText('Cells')).toBeTruthy()
}) 
