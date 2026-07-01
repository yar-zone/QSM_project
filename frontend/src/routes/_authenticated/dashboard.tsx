import { createFileRoute } from "@tanstack/react-router"

import { useAuth } from "@/hooks/use-auth"
import { StaffDashboard } from "@/components/dashboard/staff-dashboard"
import { MemberDashboard } from "@/components/dashboard/member-dashboard"
import { StudentDashboard } from "@/components/dashboard/student-dashboard"
import { ParentDashboard } from "@/components/dashboard/parent-dashboard"
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { OrganizerDashboard } from "@/components/dashboard/organizer-dashboard"

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  const { primaryRole } = useAuth()

  if (primaryRole === "admin") return <AdminDashboard />
  if (primaryRole === "organizer") return <OrganizerDashboard />
  if (primaryRole === "teacher") return <TeacherDashboard />
  if (primaryRole === "parent") return <ParentDashboard />
  return <StudentDashboard />
}
