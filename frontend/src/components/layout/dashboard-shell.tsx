import { useLocation, useNavigate } from "@tanstack/react-router"
import { LogOut, Clock, XCircle, Loader2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"
import { ROLE_LABELS } from "@/lib/roles"

function initials(name: string, email: string): string {
  const base = name.trim() || email
  const parts = base.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return base.slice(0, 2).toUpperCase()
}

const APPROVED_STATUSES = ["active", "approved"]

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, primaryRole, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const handleSignOut = async () => {
    await queryClient.cancelQueries()
    queryClient.clear()
    await signOut()
    navigate({ to: "/auth", search: { mode: "login" }, replace: true })
  }

  const name = user?.name || user?.email || "Member"
  const email = user?.email || ""
  const approved = !user || APPROVED_STATUSES.includes(user.status) || primaryRole === "admin"

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border bg-white/80 px-3 backdrop-blur-lg shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <SidebarTrigger />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-accent transition-colors">
                <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                    {initials(name, email)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium sm:inline text-foreground">{name}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="truncate font-medium">{name}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">{email}</p>
                {primaryRole && <p className="mt-1 text-xs font-normal text-primary font-medium">{ROLE_LABELS[primaryRole]}</p>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 md:p-6 pattern-dots">
          {loading ? (
            <div className="grid min-h-[60vh] place-items-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">Loading your dashboard&hellip;</p>
              </div>
            </div>
          ) : approved ? (
            <div key={location.pathname} className="fade-in">{children}</div>
          ) : (
            <PendingScreen status={user?.status ?? "pending"} onSignOut={handleSignOut} />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function PendingScreen({ status, onSignOut }: { status: string; onSignOut: () => void }) {
  const rejected = status === "inactive" || status === "rejected"
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)] fade-in-up">
        <span className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${rejected ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-warning"}`}>
          {rejected ? <XCircle className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
        </span>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          {rejected ? "Account not approved" : "Awaiting approval"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {rejected
            ? "Your registration was not approved. Please contact your school administrator."
            : "Your account has been created and is pending review. You'll gain access as soon as it's approved."}
        </p>
        <Button variant="outline" className="mt-6" onClick={onSignOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  )
}
