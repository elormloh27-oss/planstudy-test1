export default function Loading({ message = 'Loading...' }: { message?: string }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 text-center" aria-busy="true" aria-live="polite">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      <p className="mt-3 text-sm font-medium text-slate-600">{message}</p>
      <div className="mx-auto mt-6 grid max-w-2xl gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-16 rounded-2xl" />
        ))}
      </div>
    </main>
  )
} 
