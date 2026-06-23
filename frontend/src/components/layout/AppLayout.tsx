import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { ROLE_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  CreditCard,
  LogOut,
  Menu,
  X,
  UserCircle,
} from 'lucide-react'

const navItems = [
  { label: 'لوحة التحكم', path: '', icon: LayoutDashboard },
  { label: 'الطلاب', path: '/students', icon: Users },
  { label: 'المعلمون', path: '/teachers', icon: GraduationCap },
  { label: 'الفصول', path: '/classes', icon: BookOpen },
  { label: 'الحضور', path: '/attendance', icon: CalendarCheck },
  { label: 'المدفوعات', path: '/payments', icon: CreditCard },
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const basePath = `/${user?.role}`

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-200 lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <h1 className="text-xl font-bold text-primary">نور القرآن</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-text-muted hover:bg-gray-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <UserCircle className="h-10 w-10 text-primary" />
          <div>
            <p className="text-sm font-medium text-text">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-text-muted">
              {user ? ROLE_LABELS[user.role] : ''}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={`${basePath}${item.path}`}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-text-muted hover:bg-primary/10 hover:text-primary'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <LogOut className="h-5 w-5" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-white px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1 text-text-muted hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <UserCircle className="h-5 w-5" />
            <span className="hidden sm:inline">{user?.email}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
