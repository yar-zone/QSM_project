// ─── [FILE PURPOSE] ─────────────────────────────────────────────────
// Organizer dashboard — school management view.
// Similar to AdminDashboard but without total_users or audit logs access.
// Shows: 4 stats cards, date-range attendance overview, class reports table,
// management quick links, academic quick links, recent announcements.
// ─────────────────────────────────────────────────────────────────────

import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import {
  GraduationCap, UserCog, BookOpen,
  UserCheck, Clock, CheckCircle2, XCircle, ShieldCheck,
  LayoutList, Bell, Sparkles, Award,
  BookMarked, CalendarCheck, FileText, Layers,
  UsersRound,
} from "lucide-react"

import { useAuth } from "@/hooks/use-auth"
import { dashboardApi, userApi, attendanceApi, announcementApi } from "@/services/api"
import type { AttendanceClassReport, Announcement } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const RANGE_OPTIONS = [
  { label: "سنة", days: 365 },
  { label: "6 أشهر", days: 180 },
  { label: "شهر", days: 30 },
  { label: "15 يوم", days: 15 },
  { label: "7 أيام", days: 7 },
]

const STATUS_COLORS: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  absent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  late: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  excused: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
}

function categoryBadge(category: string) {
  const config: Record<string, { label: string; className: string }> = {
    general: { label: "عام", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    exams: { label: "امتحانات", className: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
    events: { label: "فعاليات", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    meetings: { label: "اجتماعات", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    urgent: { label: "عاجل", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  }
  const c = config[category] ?? { label: category, className: "bg-gray-100 text-gray-600" }
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", c.className)}>{c.label}</span>
}

export function OrganizerDashboard() {
  const { user } = useAuth()
  const firstName = (user?.name || "").split(" ")[0]
  const [rangeDays, setRangeDays] = useState(365)

  const dateTo = new Date().toISOString().slice(0, 10)
  const dateFrom = (() => {
    const d = new Date()
    d.setDate(d.getDate() - rangeDays + 1)
    return d.toISOString().slice(0, 10)
  })()

  // Dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats", rangeDays],
    queryFn: () => dashboardApi.get({ date_from: dateFrom, date_to: dateTo }),
  })

  // Pending users
  const { data: pendingUsers } = useQuery({
    queryKey: ["users-pending-count"],
    queryFn: userApi.pending,
  })

  // Attendance report
  const { data: report } = useQuery({
    queryKey: ["attendance-report", rangeDays],
    queryFn: () => attendanceApi.reports({ date_from: dateFrom, date_to: dateTo }),
  })

  // Class attendance reports
  const { data: classReports } = useQuery({
    queryKey: ["attendance-class-reports", rangeDays],
    queryFn: () => attendanceApi.classReports({ date_from: dateFrom, date_to: dateTo }),
  })

  // Announcements
  const { data: announcements, isLoading: annLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => announcementApi.list(),
  })

  const pendingCount = Array.isArray(pendingUsers) ? pendingUsers.length : 0
  const summary = report?.summary ?? {}
  const totalAtt = (summary.present ?? 0) + (summary.absent ?? 0) + (summary.late ?? 0) + (summary.excused ?? 0)
  const attended = (summary.present ?? 0) + (summary.late ?? 0)
  const pct = totalAtt > 0 ? Math.round((attended / totalAtt) * 100) : 0

  const recentAnnouncements: Announcement[] = (announcements ?? []).slice(0, 3)

  return (
    <div className="fade-in-up space-y-6">
      {/* Header */}
      <PageHeader
        title="لوحة تحكم المنظم"
        description={
          firstName
            ? `مرحباً بعودتك، ${firstName}! 👋 إدارة وتنظيم المدرسة.`
            : "مرحباً بعودتك! 👋 إدارة وتنظيم المدرسة."
        }
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

      {/* Date range selector */}
      <div className="flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.days}
            type="button"
            onClick={() => setRangeDays(opt.days)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              rangeDays === opt.days
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-accent-foreground hover:bg-accent/70",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Stats Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-hover rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] fade-in-up stagger-1">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary">
              <GraduationCap className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">الطلاب</p>
              {statsLoading ? <Skeleton className="mt-1 h-7 w-12" /> : <p className="text-2xl font-bold text-foreground">{stats?.total_students ?? 0}</p>}
            </div>
          </div>
        </div>
        <div className="card-hover rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] fade-in-up stagger-2">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary">
              <UserCog className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">المعلمون</p>
              {statsLoading ? <Skeleton className="mt-1 h-7 w-12" /> : <p className="text-2xl font-bold text-foreground">{stats?.total_teachers ?? 0}</p>}
            </div>
          </div>
        </div>
        <div className="card-hover rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] fade-in-up stagger-3">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary">
              <BookOpen className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">الفصول</p>
              {statsLoading ? <Skeleton className="mt-1 h-7 w-12" /> : <p className="text-2xl font-bold text-foreground">{stats?.total_classes ?? 0}</p>}
            </div>
          </div>
        </div>
        <div className="card-hover rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] fade-in-up stagger-4">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary">
              <LayoutList className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">المستويات</p>
              {statsLoading ? <Skeleton className="mt-1 h-7 w-12" /> : <p className="text-2xl font-bold text-foreground">{stats?.total_levels ?? 0}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Section */}
      <Card className="shadow-[var(--shadow-card)] fade-in-up">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="h-5 w-5 text-primary" />
            الحضور والغياب
            <span className="mr-2 text-xs font-normal text-muted-foreground">
              (آخر {rangeDays} يوم)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Attendance rate */}
            <div className="col-span-full lg:col-span-1 rounded-lg border border-border/60 p-4">
              <p className="text-xs text-muted-foreground">نسبة الحضور</p>
              {statsLoading ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <p className="mt-1 text-3xl font-bold text-foreground">{pct}%</p>
              )}
              <Progress value={pct} className="mt-2 h-2" />
              <p className="mt-1 text-[10px] text-muted-foreground">{totalAtt} إجمالي السجلات</p>
            </div>

            {/* Status breakdown */}
            {[
              { key: "present", label: "حاضر", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400" },
              { key: "absent", label: "غائب", icon: XCircle, color: "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400" },
              { key: "late", label: "متأخر", icon: Clock, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400" },
              { key: "excused", label: "معذور", icon: ShieldCheck, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400" },
            ].map(({ key, label, icon: Icon, color }) => (
              <div key={key} className="rounded-lg border border-border/60 p-4">
                <div className="flex items-center gap-3">
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", color)}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xl font-bold text-foreground">{summary[key] ?? 0}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Class Reports + Quick Stats Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Class Attendance Reports */}
        <div className="lg:col-span-2">
          <Card className="shadow-[var(--shadow-card)] fade-in-up">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-5 w-5 text-primary" />
                إحصائيات الحضور حسب الفصل
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!classReports || classReports.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  <p>لا توجد بيانات حضور للفترة المحددة.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الفصل</TableHead>
                        <TableHead className="text-center"><span className="text-emerald-600 dark:text-emerald-400">حاضر</span></TableHead>
                        <TableHead className="text-center"><span className="text-red-600 dark:text-red-400">غائب</span></TableHead>
                        <TableHead className="text-center"><span className="text-amber-600 dark:text-amber-400">متأخر</span></TableHead>
                        <TableHead className="text-center"><span className="text-blue-600 dark:text-blue-400">معذور</span></TableHead>
                        <TableHead className="text-center">المجموع</TableHead>
                        <TableHead className="text-center">نسبة الحضور</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classReports.map((c: AttendanceClassReport) => (
                        <TableRow key={c.class_id}>
                          <TableCell className="font-medium">{c.class_name}</TableCell>
                          <TableCell className="text-center">
                            <span className={cn("rounded px-2 py-0.5 text-xs font-medium", STATUS_COLORS.present)}>{c.present}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn("rounded px-2 py-0.5 text-xs font-medium", STATUS_COLORS.absent)}>{c.absent}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn("rounded px-2 py-0.5 text-xs font-medium", STATUS_COLORS.late)}>{c.late}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn("rounded px-2 py-0.5 text-xs font-medium", STATUS_COLORS.excused)}>{c.excused}</span>
                          </TableCell>
                          <TableCell className="text-center">{c.total}</TableCell>
                          <TableCell className="text-center">
                            <span className={cn(
                              "rounded px-2 py-0.5 text-xs font-medium",
                              c.attendance_percentage >= 80
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : c.attendance_percentage >= 60
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                            )}>
                              {c.attendance_percentage}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          {/* Management Links */}
          <Card className="shadow-[var(--shadow-card)] card-hover fade-in-up">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-primary" />
                إدارة المدرسة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/approvals"
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-gradient-to-b from-transparent to-accent/30 p-3.5 text-center transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <UserCheck className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-medium text-foreground">الموافقات</span>
                  {pendingCount > 0 && (
                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                      {pendingCount}
                    </Badge>
                  )}
                </Link>
                <Link
                  to="/students"
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-gradient-to-b from-transparent to-accent/30 p-3.5 text-center transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <GraduationCap className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-medium text-foreground">الطلاب</span>
                </Link>
                <Link
                  to="/teachers"
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-gradient-to-b from-transparent to-accent/30 p-3.5 text-center transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <UserCog className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-medium text-foreground">المعلمون</span>
                </Link>
                <Link
                  to="/classes"
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-gradient-to-b from-transparent to-accent/30 p-3.5 text-center transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-medium text-foreground">الفصول</span>
                </Link>
                <Link
                  to="/levels"
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-gradient-to-b from-transparent to-accent/30 p-3.5 text-center transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <LayoutList className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-medium text-foreground">المستويات</span>
                </Link>
                <Link
                  to="/parents"
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-gradient-to-b from-transparent to-accent/30 p-3.5 text-center transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <UsersRound className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-medium text-foreground">أولياء الأمور</span>
                </Link>
                <Link
                  to="/announcements"
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-gradient-to-b from-transparent to-accent/30 p-3.5 text-center transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Bell className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-medium text-foreground">الإعلانات</span>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Academic Links */}
          <Card className="shadow-[var(--shadow-card)] card-hover fade-in-up">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-5 w-5 text-primary" />
                الأكاديميا
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/memorizations"
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-gradient-to-b from-transparent to-accent/30 p-3.5 text-center transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <BookMarked className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-medium text-foreground">الحفظ</span>
                </Link>
                <Link
                  to="/exam-results"
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-gradient-to-b from-transparent to-accent/30 p-3.5 text-center transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Award className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-medium text-foreground">الامتحانات</span>
                </Link>
                <Link
                  to="/certificates"
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-gradient-to-b from-transparent to-accent/30 p-3.5 text-center transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-medium text-foreground">الشهادات</span>
                </Link>
                <Link
                  to="/subjects"
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-gradient-to-b from-transparent to-accent/30 p-3.5 text-center transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-medium text-foreground">المواد</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Announcements */}
      <Card className="shadow-[var(--shadow-card)] card-hover fade-in-up">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5 text-primary" />
            آخر الإعلانات
            <Link to="/announcements" className="mr-auto text-xs font-normal text-primary hover:underline">
              عرض الكل
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {annLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-3/4" />
            </div>
          ) : recentAnnouncements.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              <Bell className="mx-auto mb-2 h-8 w-8 opacity-40" />
              <p>لا توجد إعلانات حديثة.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAnnouncements.map((a) => (
                <Link
                  key={a.id}
                  to="/announcements"
                  className="block rounded-lg border border-border/50 p-3 transition-all hover:bg-accent/30 hover:border-border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.content}</p>
                    </div>
                    {categoryBadge(a.category)}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{a.author?.name || "إدارة المدرسة"}</span>
                    <span>·</span>
                    <span>{new Date(a.published_at).toLocaleDateString("ar-SA")}</span>
                    {a.is_pinned && (
                      <>
                        <span>·</span>
                        <Badge variant="outline" className="text-[9px] px-1.5">مثبت</Badge>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
