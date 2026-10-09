import { Component, type ReactNode } from 'react'

export default class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <p className="text-lg font-bold">Something went wrong</p>
          <p className="mt-1 text-sm text-slate-600">{this.state.error.message}</p>
          <button onClick={() => window.location.reload()} className="btn-lively mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white">
            Reload
          </button>
        </main>
      )
    }
    return this.props.children
  }
} 
