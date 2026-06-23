import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import type { Role } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: Role[]
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />
  }

  return <>{children}</>
}
