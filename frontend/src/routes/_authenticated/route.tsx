import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { TOKEN_KEY } from "@/lib/constants"
import { DashboardShell } from "@/components/layout/dashboard-shell"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      throw redirect({ to: "/auth", search: { mode: "login" } as any })
    }
    // Don't fetch user here — useAuth() in DashboardShell handles it
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