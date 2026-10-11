import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { friendlyAuthErrorMessage } from '@/lib/authErrors'
import { useToast } from '@/components/Toast'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const [resending, setResending] = useState(false)
  const navigate = useNavigate()
  const { push } = useToast()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    if (!isSupabaseConfigured) {
      navigate('/dashboard')
      return
    }
    setBusy(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    setBusy(false)
    if (error) {
      push(friendlyAuthErrorMessage(error))
      return
    }
    if (!data?.session) {
      setNeedsConfirm(true)
      push('Account created. Check your email to confirm it, then log in.')
      return
    }
    setNeedsConfirm(false)
    push('Account created. Welcome!')
    navigate('/dashboard')
  }

  async function onResend() {
    if (resending) return
    setResending(true)
    try {
      const { error: resendError } = await supabase.auth.resend({ type: 'signup', email })
      if (resendError) {
        push(friendlyAuthErrorMessage(resendError))
        return
      }
      push('Confirmation email resent. Check your inbox.')
    } finally {
      setResending(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <img src="/planstudy-logo.svg" alt="PlanStudy" className="h-8 w-auto" />
      <p className="mt-4 text-sm font-medium text-indigo-600">Free plan</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Create your account</h1>
      <form onSubmit={onSubmit} className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <label htmlFor="signup-email" className="block text-sm font-medium">Email</label>
        <input id="signup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        <label htmlFor="signup-password" className="mt-4 block text-sm font-medium">Password</label>
        <input id="signup-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6+ characters" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        <button disabled={busy} className="mt-5 w-full rounded-xl bg-indigo-600 py-3.5 font-semibold text-white active:bg-indigo-700 disabled:opacity-50">
          {busy ? 'Creating...' : 'Start free'}
        </button>
      </form>
      {needsConfirm && (
        <div className="mt-4 rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Check your email to confirm your account, then log in.</p>
          <button type="button" onClick={onResend} disabled={resending} className="mt-3 w-full rounded-xl bg-indigo-600 py-3.5 font-semibold text-white active:bg-indigo-700 disabled:opacity-50">
            {resending ? 'Resending…' : 'Resend confirmation email'}
          </button>
        </div>
      )}
      <p className="mt-4 text-center text-sm text-slate-600">
        Have an account? <Link to="/login" className="font-semibold text-indigo-600">Log in</Link>
      </p>
    </main>
  )
} 
