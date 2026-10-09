import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface ToastItem {
  id: number
  message: string
}

const ToastCtx = createContext<{ push: (message: string) => void }>({ push: () => {} })

export function useToast() {
  return useContext(ToastCtx)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const push = useCallback((message: string) => {
    const id = Date.now() + Math.random()
    setItems((xs) => [...xs, { id, message }])
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3200)
  }, [])
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div aria-live="polite" className="fixed bottom-20 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-6">
        {items.map((t) => (
          <div key={t.id} className="anim-fade-up rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
} 
