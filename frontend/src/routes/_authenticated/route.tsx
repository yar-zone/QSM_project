// ─── [FILE PURPOSE] ─────────────────────────────────────────────────
// Auth guard layout route — wraps ALL authenticated pages.
// beforeLoad: checks localStorage for a token, redirects to /auth if missing.
// The actual user fetch happens inside DashboardShell via useAuth().
// Renders the sidebar + app shell around the nested child route (<Outlet />).
// ─────────────────────────────────────────────────────────────────────

import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { TOKEN_KEY } from "@/lib/constants"
import { DashboardShell } from "@/components/layout/dashboard-shell"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      throw redirect({ to: "/auth", search: { mode: "login" } as any })
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