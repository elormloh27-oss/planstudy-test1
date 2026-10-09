import { it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Landing from '@/pages/Landing'

it('landing links to start free', () => {
  render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>
  )
  expect(screen.getAllByText(/start free/i).length).toBeGreaterThan(0)
}) 
