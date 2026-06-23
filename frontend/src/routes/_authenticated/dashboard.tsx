import { createFileRoute } from "@tanstack/react-router"

import { useAuth } from "@/hooks/use-auth"
import { StaffDashboard } from "@/components/dashboard/staff-dashboard"
import { MemberDashboard } from "@/components/dashboard/member-dashboard"

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  const { primaryRole } = useAuth()

  if (primaryRole === "admin") return <StaffDashboard isAdmin />
  if (primaryRole === "organizer") return <StaffDashboard isAdmin={false} />
  if (primaryRole === "teacher") return <MemberDashboard role="teacher" />
  if (primaryRole === "parent") return <MemberDashboard role="parent" />
  return <MemberDashboard role="student" />
}
