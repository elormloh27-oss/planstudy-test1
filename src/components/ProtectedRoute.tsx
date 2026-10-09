import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '@/hooks/useSession'
import Loading from '@/components/Loading'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { email, loading, demo } = useSession()
  if (loading) return <Loading message="Checking session..." />
  if (!email && !demo) return <Navigate to="/login" replace />
  return <>{children}</>
} 
