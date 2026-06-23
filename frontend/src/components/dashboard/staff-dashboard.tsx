import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Users, GraduationCap, UserCog, Clock, UserCheck } from "lucide-react"

import { dashboardApi, userApi } from "@/services/api"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function StaffDashboard({ isAdmin }: { isAdmin: boolean }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardApi.get,
  })

  const { data: pendingUsers } = useQuery({
    queryKey: ["users-pending-count"],
    queryFn: userApi.pending,
  })

  const pendingCount = Array.isArray(pendingUsers) ? pendingUsers.length : 0

  return (
    <div>
      <PageHeader
        title={isAdmin ? "Admin Dashboard" : "Organizer Dashboard"}
        description="School-wide overview and key metrics."
      >
        {pendingCount > 0 && (
          <Button asChild>
            <Link to="/approvals">
              <UserCheck className="mr-2 h-4 w-4" />
              {pendingCount} pending
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={stats?.total_students ?? 0} icon={GraduationCap} loading={isLoading} />
        <StatCard label="Total Teachers" value={stats?.total_teachers ?? 0} icon={UserCog} loading={isLoading} />
        <StatCard label="Total Classes" value={stats?.total_classes ?? 0} icon={Users} loading={isLoading} />
        <StatCard label="Total Levels" value={stats?.total_levels ?? 0} icon={Users} loading={isLoading} />
        <StatCard label="Attendance Rate" value={stats ? `${Math.round(stats.attendance_rate)}%` : "0%"} icon={Clock} loading={isLoading} />
        <StatCard label="Pending Approvals" value={stats?.pending_approvals ?? 0} icon={UserCheck} loading={isLoading} />
      </div>

      <Card className="mt-6 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/approvals">Review approvals</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/profile">My profile</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
