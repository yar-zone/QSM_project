import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { authApi } from "@/services/api"
import { TOKEN_KEY, USER_KEY } from "@/lib/constants"
import { DashboardShell } from "@/components/layout/dashboard-shell"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) throw redirect({ to: "/auth", search: { mode: "login" } })
    try {
      const user = await authApi.me()
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      return { user }
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      window.dispatchEvent(new Event("auth:logout"))
      throw redirect({ to: "/auth", search: { mode: "login" } })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  )
}
