import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '@/pages/Login'
import { ToastProvider } from '@/components/Toast'

const { mockSignIn, mockNavigate } = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
  mockNavigate: vi.fn(),
}))

vi.mock('@/lib/supabaseClient', () => ({
  supabase: { auth: { signInWithPassword: mockSignIn } },
  isSupabaseConfigured: true,
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

const NOT_CONFIRMED_FRIENDLY =
  'Please confirm your email first — check your inbox, then try again.'

function renderLogin() {
  const utils = render(
    <MemoryRouter>
      <ToastProvider>
        <Login />
      </ToastProvider>
    </MemoryRouter>
  )
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
  const form = utils.container.querySelector('form')!
  return { form }
}

beforeEach(() => {
  mockSignIn.mockReset()
  mockNavigate.mockReset()
})

describe('Login', () => {
  it('shows the friendly message on unconfirmed-email errors, not the raw error', async () => {
    mockSignIn.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Email not confirmed' },
    })
    const { form } = renderLogin()
    fireEvent.submit(form)

    expect(await screen.findByText(NOT_CONFIRMED_FRIENDLY)).toBeInTheDocument()
    expect(screen.queryByText('Email not confirmed')).not.toBeInTheDocument()
  })

  it('ignores rapid double submit and calls signInWithPassword exactly once', async () => {
    mockSignIn.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { session: {}, user: {} }, error: null }), 50)
        )
    )
    const { form } = renderLogin()
    fireEvent.submit(form)
    fireEvent.submit(form)

    // Let the in-flight signIn promise settle so its continuation
    // cannot leak navigate/toast calls into the next test.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100))
    })
    expect(mockSignIn).toHaveBeenCalledTimes(1)
  })
})
