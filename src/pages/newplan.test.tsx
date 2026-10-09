import { it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NewPlan from '@/pages/NewPlan'
import { ToastProvider } from '@/components/Toast'

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
