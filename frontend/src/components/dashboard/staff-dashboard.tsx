import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Users, GraduationCap, UserCog, Clock, UserCheck, BookOpen, TrendingUp, CheckCircle2, XCircle, ShieldCheck } from "lucide-react"
import { useState } from "react"

import { dashboardApi, userApi, attendanceApi } from "@/services/api"
import type { AttendanceClassReport } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

const RANGE_OPTIONS = [
  { label: "سنة", days: 365 },
  { label: "6 أشهر", days: 180 },
  { label: "شهر", days: 30 },
  { label: "15 يوم", days: 15 },
  { label: "7 أيام", days: 7 },
]

const STATS_CONFIG = [
  { key: "present", label: "حاضر", icon: CheckCircle2, class: "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950" },
  { key: "absent", label: "غائب", icon: XCircle, class: "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950" },
  { key: "late", label: "متأخر", icon: Clock, class: "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950" },
  { key: "excused", label: "معذور", icon: ShieldCheck, class: "text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950" },
]

const STATUS_COLORS: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  absent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  late: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  excused: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
}

export function StaffDashboard({ isAdmin }: { isAdmin: boolean }) {
  const [rangeDays, setRangeDays] = useState(365)

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", rangeDays],
    queryFn: () => {
      const date_to = new Date().toISOString().slice(0, 10)
      const from = new Date()
      from.setDate(from.getDate() - rangeDays + 1)
      return dashboardApi.get({ date_from: from.toISOString().slice(0, 10), date_to })
    },
  })

  const { data: pendingUsers } = useQuery({
    queryKey: ["users-pending-count"],
    queryFn: userApi.pending,
  })

  const { data: report } = useQuery({
    queryKey: ["attendance-report", rangeDays],
    queryFn: () => {
      const date_to = new Date().toISOString().slice(0, 10)
      const from = new Date()
      from.setDate(from.getDate() - rangeDays + 1)
      return attendanceApi.reports({ date_from: from.toISOString().slice(0, 10), date_to })
    },
  })

  const { data: classReports } = useQuery({
    queryKey: ["attendance-class-reports", rangeDays],
    queryFn: () => {
      const date_to = new Date().toISOString().slice(0, 10)
      const from = new Date()
      from.setDate(from.getDate() - rangeDays + 1)
      return attendanceApi.classReports({ date_from: from.toISOString().slice(0, 10), date_to })
    },
  })

  const pendingCount = Array.isArray(pendingUsers) ? pendingUsers.length : 0
  const summary = report?.summary ?? {}
  const total = (summary.present ?? 0) + (summary.absent ?? 0) + (summary.late ?? 0) + (summary.excused ?? 0)
  const attended = (summary.present ?? 0) + (summary.late ?? 0)
  const pct = total > 0 ? Math.round((attended / total) * 100) : 0

  return (
    <div className="fade-in-up">
      <PageHeader
        title={isAdmin ? "لوحة تحكم المدير" : "لوحة تحكم المنظم"}
        description="نظرة عامة على المدرسة والمؤشرات الرئيسية."
      >
        {pendingCount > 0 && (
          <Button asChild size="sm" className="relative">
            <Link to="/approvals">
              <UserCheck className="ml-2 h-4 w-4" />
              {pendingCount} قيد الانتظار
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.days}
            type="button"
            onClick={() => setRangeDays(opt.days)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${rangeDays === opt.days
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-accent-foreground hover:bg-accent/70"
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="إجمالي الطلاب" value={stats?.total_students ?? 0} icon={GraduationCap} loading={isLoading} delay="stagger-1" />
        <StatCard label="إجمالي المعلمين" value={stats?.total_teachers ?? 0} icon={UserCog} loading={isLoading} delay="stagger-2" />
        <StatCard label="إجمالي الفصول" value={stats?.total_classes ?? 0} icon={BookOpen} loading={isLoading} delay="stagger-3" />
        <StatCard label="إجمالي المستويات" value={stats?.total_levels ?? 0} icon={TrendingUp} loading={isLoading} delay="stagger-4" />
        <StatCard label="نسبة الحضور" value={isLoading ? "0%" : `${pct}%`} icon={Clock} loading={isLoading} delay="stagger-5" />
        <StatCard label="الموافقات المعلقة" value={stats?.pending_approvals ?? 0} icon={UserCheck} loading={isLoading} delay="stagger-6" />
      </div>

      <div className="mt-6 mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS_CONFIG.map(({ key, label, icon: Icon, class: cls }) => (
          <div key={key} className="rounded-lg border p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <span className={`grid h-10 w-10 place-items-center rounded-full ${cls}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-bold">{summary[key] ?? 0}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {classReports && classReports.length > 0 && (
        <Card className="mb-6 shadow-[var(--shadow-card)] fade-in-up">
          <CardHeader><CardTitle className="text-base">إحصائيات الحضور حسب الفصل</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الفصل</TableHead>
                  <TableHead>حاضر</TableHead>
                  <TableHead>غائب</TableHead>
                  <TableHead>متأخر</TableHead>
                  <TableHead>معذور</TableHead>
                  <TableHead>المجموع</TableHead>
                  <TableHead>نسبة الحضور</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classReports.map((c: AttendanceClassReport) => (
                  <TableRow key={c.class_id}>
                    <TableCell className="font-medium">{c.class_name}</TableCell>
                    <TableCell><span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS.present}`}>{c.present}</span></TableCell>
                    <TableCell><span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS.absent}`}>{c.absent}</span></TableCell>
                    <TableCell><span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS.late}`}>{c.late}</span></TableCell>
                    <TableCell><span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS.excused}`}>{c.excused}</span></TableCell>
                    <TableCell>{c.total}</TableCell>
                    <TableCell>{c.attendance_percentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-1">
        <Card className="card-hover shadow-[var(--shadow-card)] fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              روابط سريعة
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/approvals"><UserCheck className="ml-1 h-4 w-4" />مراجعة الموافقات</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/students"><GraduationCap className="ml-1 h-4 w-4" />الطلاب</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/teachers"><UserCog className="ml-1 h-4 w-4" />المعلمون</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/classes"><BookOpen className="ml-1 h-4 w-4" />الفصول</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/profile"><Users className="ml-1 h-4 w-4" />ملفي الشخصي</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
