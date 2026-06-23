import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Users, GraduationCap, UserCog, Clock, UserCheck, BookOpen, TrendingUp } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

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

  const attendanceData = [
    { name: "Present", value: stats?.attendance_rate ?? 0, color: "#007979" },
    { name: "Absent", value: 100 - (stats?.attendance_rate ?? 0), color: "#DC2626" },
  ]

  return (
    <div className="fade-in-up">
      <PageHeader
        title={isAdmin ? "Admin Dashboard" : "Organizer Dashboard"}
        description="School-wide overview and key metrics."
      >
        {pendingCount > 0 && (
          <Button asChild size="sm" className="relative">
            <Link to="/approvals">
              <UserCheck className="mr-2 h-4 w-4" />
              {pendingCount} pending
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={stats?.total_students ?? 0} icon={GraduationCap} loading={isLoading} delay="stagger-1" />
        <StatCard label="Total Teachers" value={stats?.total_teachers ?? 0} icon={UserCog} loading={isLoading} delay="stagger-2" />
        <StatCard label="Total Classes" value={stats?.total_classes ?? 0} icon={BookOpen} loading={isLoading} delay="stagger-3" />
        <StatCard label="Total Levels" value={stats?.total_levels ?? 0} icon={TrendingUp} loading={isLoading} delay="stagger-4" />
        <StatCard label="Attendance Rate" value={stats ? `${Math.round(stats.attendance_rate)}%` : "0%"} icon={Clock} loading={isLoading} delay="stagger-5" />
        <StatCard label="Pending Approvals" value={stats?.pending_approvals ?? 0} icon={UserCheck} loading={isLoading} delay="stagger-6" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="card-hover shadow-[var(--shadow-card)] fade-in-up stagger-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {attendanceData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {attendanceData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="ml-auto font-semibold">{Math.round(d.value)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover shadow-[var(--shadow-card)] fade-in-up stagger-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Quick Links
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/approvals"><UserCheck className="mr-1 h-4 w-4" />Review approvals</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/students"><GraduationCap className="mr-1 h-4 w-4" />Students</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/teachers"><UserCog className="mr-1 h-4 w-4" />Teachers</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/classes"><BookOpen className="mr-1 h-4 w-4" />Classes</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/profile"><Users className="mr-1 h-4 w-4" />My profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
