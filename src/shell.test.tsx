import { it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '@/components/Navbar'

it('renders brand', () => {
  render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  )
  expect(screen.getByAltText(/planstudy/i)).toBeTruthy()
}) 
