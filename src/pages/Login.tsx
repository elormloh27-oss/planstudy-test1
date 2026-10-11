import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { friendlyAuthErrorMessage } from '@/lib/authErrors'
import { useToast } from '@/components/Toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) {
      push(friendlyAuthErrorMessage(error))
      return
    }
    navigate('/dashboard')
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <img src="/planstudy-logo.svg" alt="PlanStudy" className="h-8 w-auto" />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-slate-600">Log in to your study plans.</p>
      {!isSupabaseConfigured && (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">Demo mode. Any login continues locally.</p>
      )}
      <form onSubmit={onSubmit} className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <label htmlFor="login-email" className="block text-sm font-medium">Email</label>
        <input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        <label htmlFor="login-password" className="mt-4 block text-sm font-medium">Password</label>
        <input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        <button disabled={busy} className="mt-5 w-full rounded-xl bg-indigo-600 py-3.5 font-semibold text-white active:bg-indigo-700 disabled:opacity-50">
          {busy ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        No account? <Link to="/signup" className="font-semibold text-indigo-600">Start free</Link>
      </p>
    </main>
  )
} 
