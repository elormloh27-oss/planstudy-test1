import { it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SessionTimer from '@/components/SessionTimer'

it('timer shows block count', () => {
  render(
    <SessionTimer
      task={{ id: 'a', title: 'T', date: '2026-10-08', duration_min: 60, done: false }}
      startBlock={0}
      onBlockDone={() => {}}
      onTaskDone={() => {}}
      onClose={() => {}}
    />
  )
  expect(screen.getByText(/block 1 of/i)).toBeTruthy()
}) 
