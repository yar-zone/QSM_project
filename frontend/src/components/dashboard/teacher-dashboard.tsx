import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import {
  BookOpen, Award, CalendarCheck, Bell,
  BookMarked, Clock, CheckCircle2, XCircle,
  GraduationCap, Sparkles, ArrowRight, FileText,
  Users, Layers,
} from "lucide-react"

import { useAuth } from "@/hooks/use-auth"
import {
  dashboardApi, classApi, memorizationApi,
  attendanceApi, announcementApi, examResultApi,
} from "@/services/api"
import type { MemorizationTracking, Announcement, Classe } from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const DELAYS = ["stagger-1", "stagger-2", "stagger-3", "stagger-4"]

// ─── Helpers ───────────────────────────────────────────────────────

function performanceScoreColor(score: number): string {
  if (score >= 85) return "text-emerald-600 dark:text-emerald-400"
  if (score >= 70) return "text-teal-600 dark:text-teal-400"
  if (score >= 50) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

function statusBadge(status: string) {
  const config: Record<string, { label: string; className: string }> = {
    present: { label: "حاضر", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    absent: { label: "غائب", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    late: { label: "متأخر", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    excused: { label: "معذور", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  }
  const c = config[status] ?? { label: status, className: "bg-gray-100 text-gray-600" }
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", c.className)}>{c.label}</span>
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

// ─── Main Component ────────────────────────────────────────────────

export function TeacherDashboard() {
  const { user } = useAuth()
  const firstName = (user?.name || "").split(" ")[0]

  // Dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats", "teacher"],
    queryFn: () => dashboardApi.get(),
  })

  // Classes list
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: () => classApi.list(),
  })

  // Memorization records
  const { data: memorizations, isLoading: memLoading } = useQuery({
    queryKey: ["memorizations"],
    queryFn: () => memorizationApi.list(),
  })

  // Attendance records
  const { data: attendances, isLoading: attLoading } = useQuery({
    queryKey: ["attendance", "all"],
    queryFn: () => attendanceApi.list(),
  })

  // Exam results
  const { data: examResults, isLoading: examLoading } = useQuery({
    queryKey: ["exam-results", "all"],
    queryFn: () => examResultApi.list(),
  })

  // Announcements
  const { data: announcements, isLoading: annLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => announcementApi.list(),
  })

  const classesList: Classe[] = (classes ?? []).slice(0, 5)
  const recentMemorizations: MemorizationTracking[] = (memorizations ?? []).slice(0, 5)
  const recentAttendances = (attendances ?? []).slice(0, 5)
  const recentAnnouncements: Announcement[] = (announcements ?? []).slice(0, 3)

  // Attendance summary
  const attSummary = (attendances ?? []).reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1
      acc.total++
      return acc
    },
    { present: 0, absent: 0, late: 0, excused: 0, total: 0 } as Record<string, number>,
  )
  const attendanceRate = attSummary.total > 0
    ? Math.round(((attSummary.present + attSummary.late) / attSummary.total) * 100)
    : 0

  // Exam pass rate
  const passedExams = (examResults ?? []).filter((r: any) => r.is_passed).length
  const totalExams = (examResults ?? []).length
  const passRate = totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0

  // Total verses memorized across all students
  const totalVerses = (memorizations ?? []).reduce((sum: number, m: MemorizationTracking) => sum + (m.verses_memorized || 0), 0)

  return (
    <div className="fade-in-up space-y-6">
      {/* Welcome Header */}
      <PageHeader
        title="لوحة تحكم المعلم"
        description={
          firstName
            ? `مرحباً بعودتك، ${firstName}! 👋 تابع تقدّم طلابك وفصولك.`
            : "مرحباً بعودتك! 👋"
        }
      />

      {/* Stats Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-hover rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] fade-in-up stagger-1">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary">
              <BookOpen className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">فصولي</p>
              {statsLoading ? (
                <Skeleton className="mt-1 h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold tracking-tight text-foreground">{stats?.my_classes ?? 0}</p>
              )}
            </div>
          </div>
        </div>
        <div className="card-hover rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] fade-in-up stagger-2">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary">
              <Users className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">طلابي</p>
              {statsLoading ? (
                <Skeleton className="mt-1 h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold tracking-tight text-foreground">{stats?.my_students ?? 0}</p>
              )}
            </div>
          </div>
        </div>
        <div className="card-hover rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] fade-in-up stagger-3">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary">
              <BookMarked className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">إجمالي الآيات المحفوظة</p>
              {memLoading ? (
                <Skeleton className="mt-1 h-7 w-16" />
              ) : (
                <p className="text-2xl font-bold tracking-tight text-foreground">{totalVerses}</p>
              )}
            </div>
          </div>
        </div>
        <div className="card-hover rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] fade-in-up stagger-4">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary">
              <Award className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">نسبة النجاح</p>
              {examLoading ? (
                <Skeleton className="mt-1 h-7 w-14" />
              ) : (
                <p className="text-2xl font-bold tracking-tight text-foreground">{totalExams > 0 ? `${passRate}%` : "—"}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* My Classes */}
        <Card className="shadow-[var(--shadow-card)] card-hover fade-in-up stagger-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-5 w-5 text-primary" />
              فصولي
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-3/4" />
              </div>
            ) : classesList.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <Layers className="mx-auto mb-2 h-8 w-8 opacity-40" />
                <p>لا توجد فصول مسجلة.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {classesList.map((c) => (
                  <Link
                    key={c.id}
                    to="/classes"
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-all hover:bg-accent/20"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.level?.name ?? "—"}
                        {c.academic_year ? ` · ${c.academic_year}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-left">
                      <Badge variant="outline" className="text-xs">
                        {c.max_students ? `${c.max_students} طالب` : "—"}
                      </Badge>
                    </div>
                  </Link>
                ))}
                <Link
                  to="/classes"
                  className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  عرض كل الفصول
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Memorization Sessions */}
        <Card className="shadow-[var(--shadow-card)] card-hover fade-in-up stagger-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-5 w-5 text-primary" />
              آخر جلسات الحفظ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {memLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-3/4" />
              </div>
            ) : recentMemorizations.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <BookOpen className="mx-auto mb-2 h-8 w-8 opacity-40" />
                <p>لا توجد جلسات حفظ مسجلة.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentMemorizations.map((m) => (
                  <div key={m.id} className="rounded-lg border border-border/50 p-3 transition-colors hover:bg-accent/20">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {m.student?.user?.name ?? `طالب #${m.student_id}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {m.surah?.name || `الجزء ${m.juz || "—"}`}
                        </p>
                      </div>
                      <div className="shrink-0 text-left">
                        <p className="text-sm font-semibold text-primary">+{m.verses_memorized}</p>
                        <p className="text-xs text-muted-foreground">آية</p>
                      </div>
                    </div>
                    {m.performance_score != null && (
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={m.performance_score} className="h-1.5 flex-1" />
                        <span className={cn("text-xs font-medium", performanceScoreColor(m.performance_score))}>
                          {m.performance_score}%
                        </span>
                      </div>
                    )}
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(m.start_date || m.created_at).toLocaleDateString("ar-SA")}
                    </p>
                  </div>
                ))}
                <Link
                  to="/memorizations"
                  className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  عرض كل جلسات الحفظ
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Overview */}
        <Card className="shadow-[var(--shadow-card)] card-hover fade-in-up stagger-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="h-5 w-5 text-primary" />
              الحضور
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : recentAttendances.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <Clock className="mx-auto mb-2 h-8 w-8 opacity-40" />
                <p>لا توجد سجلات حضور.</p>
              </div>
            ) : (
              <>
                {/* Summary mini-stats */}
                <div className="mb-3 grid grid-cols-4 gap-2">
                  <div className="rounded-lg bg-emerald-50 p-2 text-center dark:bg-emerald-950/30">
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{attSummary.present}</p>
                    <p className="text-[10px] text-muted-foreground">حاضر</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-2 text-center dark:bg-red-950/30">
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">{attSummary.absent}</p>
                    <p className="text-[10px] text-muted-foreground">غائب</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-2 text-center dark:bg-amber-950/30">
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{attSummary.late}</p>
                    <p className="text-[10px] text-muted-foreground">متأخر</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-2 text-center dark:bg-blue-950/30">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{attSummary.excused}</p>
                    <p className="text-[10px] text-muted-foreground">معذور</p>
                  </div>
                </div>
                {/* Attendance rate bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">نسبة الحضور</span>
                    <span className="font-semibold text-foreground">{attendanceRate}%</span>
                  </div>
                  <Progress value={attendanceRate} className="mt-1 h-2" />
                </div>
                {/* Recent records */}
                <div className="space-y-1.5">
                  {recentAttendances.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-accent/20">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground">
                          {new Date(a.date).toLocaleDateString("ar-SA", { weekday: "short", day: "numeric", month: "short" })}
                        </span>
                        {a.student?.user?.name && (
                          <span className="truncate text-xs text-muted-foreground/60">· {a.student.user.name}</span>
                        )}
                      </div>
                      {statusBadge(a.status)}
                    </div>
                  ))}
                </div>
                <Link
                  to="/attendance"
                  className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  عرض كل سجلات الحضور
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Exam Results + Quick Actions Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Exam Results */}
        <Card className="shadow-[var(--shadow-card)] card-hover fade-in-up stagger-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-5 w-5 text-primary" />
              نتائج الامتحانات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {examLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : totalExams === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
                <p>لا توجد نتائج امتحانات بعد.</p>
              </div>
            ) : (
              <>
                <div className="mb-3 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 text-center dark:from-emerald-950/30 dark:to-emerald-900/20">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{passedExams}</p>
                    <p className="text-xs text-muted-foreground">ناجح</p>
                  </div>
                  <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100/50 p-3 text-center dark:from-red-950/30 dark:to-red-900/20">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalExams - passedExams}</p>
                    <p className="text-xs text-muted-foreground">راسب</p>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">نسبة النجاح</span>
                    <span className="font-semibold text-foreground">{passRate}%</span>
                  </div>
                  <Progress value={passRate} className="mt-1 h-2" />
                </div>
                <div className="space-y-1.5">
                  {(examResults ?? []).slice(0, 4).map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-accent/20">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {r.student?.user?.name ?? r.exam_request?.student?.user?.name ?? `طالب #${r.student_id ?? r.exam_request?.student_id}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.exam_request?.hizb_count ? `${r.exam_request.hizb_count} حزب` : r.level?.name || "امتحان"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                          r.is_passed
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                          {r.is_passed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {r.grade || (r.is_passed ? "ناجح" : "راسب")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  to="/exam-results"
                  className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  عرض كل نتائج الامتحانات
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions + Announcements */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card className="shadow-[var(--shadow-card)] card-hover fade-in-up stagger-5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-primary" />
                إجراءات سريعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/students"
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-gradient-to-b from-transparent to-accent/30 p-4 text-center transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium text-foreground">الطلاب</span>
                  <span className="text-[10px] text-muted-foreground">إدارة الطلاب</span>
                </Link>
                <Link
                  to="/classes"
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-gradient-to-b from-transparent to-accent/30 p-4 text-center transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium text-foreground">الفصول</span>
                  <span className="text-[10px] text-muted-foreground">إدارة الفصول</span>
                </Link>
                <Link
                  to="/memorizations"
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-gradient-to-b from-transparent to-accent/30 p-4 text-center transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <BookMarked className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium text-foreground">الحفظ</span>
                  <span className="text-[10px] text-muted-foreground">تسجيل الحفظ</span>
                </Link>
                <Link
                  to="/attendance"
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-gradient-to-b from-transparent to-accent/30 p-4 text-center transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <CalendarCheck className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium text-foreground">الحضور</span>
                  <span className="text-[10px] text-muted-foreground">تسجيل الحضور</span>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Announcements */}
          <Card className="shadow-[var(--shadow-card)] card-hover fade-in-up stagger-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-5 w-5 text-primary" />
                آخر الإعلانات
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
                      </div>
                    </Link>
                  ))}
                  <Link
                    to="/announcements"
                    className="mt-1 flex items-center justify-center gap-1 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    عرض كل الإعلانات
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
