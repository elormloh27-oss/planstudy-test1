import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Signup from '@/pages/Signup'
import { ToastProvider } from '@/components/Toast'

const { mockSignUp, mockNavigate } = vi.hoisted(() => ({
  mockSignUp: vi.fn(),
  mockNavigate: vi.fn(),
}))

vi.mock('@/lib/supabaseClient', () => ({
  supabase: { auth: { signUp: mockSignUp } },
  isSupabaseConfigured: true,
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

const RATE_LIMIT_FRIENDLY =
  'Too many attempts. Check your inbox for a confirmation email, or wait a few minutes and try logging in.'

function renderSignup() {
  const utils = render(
    <MemoryRouter>
      <ToastProvider>
        <Signup />
      </ToastProvider>
    </MemoryRouter>
  )
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
  const form = utils.container.querySelector('form')!
  return { form }
}

beforeEach(() => {
  mockSignUp.mockReset()
  mockNavigate.mockReset()
})

describe('Signup', () => {
  it('shows the friendly message on rate-limit errors, not the raw error', async () => {
    mockSignUp.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Email rate limit exceeded', status: 429, code: 'over_email_send_rate_limit' },
    })
    const { form } = renderSignup()
    fireEvent.submit(form)

    expect(await screen.findByText(RATE_LIMIT_FRIENDLY)).toBeInTheDocument()
    expect(screen.queryByText(/email rate limit exceeded/i)).not.toBeInTheDocument()
  })

  it('ignores rapid double submit and calls signUp exactly once', async () => {
    mockSignUp.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { session: {}, user: {} }, error: null }), 50)
        )
    )
    const { form } = renderSignup()
    fireEvent.submit(form)
    fireEvent.submit(form)

    // Let the in-flight signUp promise settle so its continuation
    // cannot leak navigate/toast calls into the next test.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100))
    })
    expect(mockSignUp).toHaveBeenCalledTimes(1)
  })

  it('does not navigate to /dashboard when the session is null', async () => {
    mockSignUp.mockResolvedValue({
      data: { session: null, user: { id: 'user-1' } },
      error: null,
    })
    const { form } = renderSignup()
    fireEvent.submit(form)

    await waitFor(() => expect(mockSignUp).toHaveBeenCalledTimes(1))
    // Settle to allow any delayed navigate to fire pre-fix; post-fix nothing fires.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })
    await waitFor(() => expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard'))
  })
})
