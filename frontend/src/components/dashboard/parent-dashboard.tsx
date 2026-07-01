// ─── [FILE PURPOSE] ─────────────────────────────────────────────────
// Parent dashboard — shows progress data for the parent's children.
// Features child selector cards, per-child stats (memorized, revised,
// avg score, sessions), memorization sessions, attendance overview,
// exam results, certificates list, quick actions, announcements.
// Handles no-children edge case with friendly empty state.
// ─────────────────────────────────────────────────────────────────────

import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import {
  BookOpen, Award, CalendarCheck, Bell, Target,
  BookMarked, Star, Clock, CheckCircle2, XCircle,
  GraduationCap, Sparkles, ArrowRight, FileText, Medal,
  Heart,
} from "lucide-react"

import { useAuth } from "@/hooks/use-auth"
import {
  dashboardApi, memorizationApi, attendanceApi,
  examResultApi, certificateApi, announcementApi,
} from "@/services/api"
import type {
  MemorizationTracking, Attendance, ExamResult,
  Announcement, Certificate,
} from "@/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
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
    present: {
      label: "حاضر",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    absent: {
      label: "غائب",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    late: {
      label: "متأخر",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    excused: {
      label: "معذور",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
  }
  const c = config[status] ?? { label: status, className: "bg-gray-100 text-gray-600" }
  return (
    <span
      className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", c.className)}
    >
      {c.label}
    </span>
  )
}

function examGradeBadge(isPassed: boolean, grade?: string) {
  if (isPassed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        {grade || "ناجح"}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <XCircle className="h-3 w-3" />
      {grade || "راسب"}
    </span>
  )
}

function categoryBadge(category: string) {
  const config: Record<string, { label: string; className: string }> = {
    general: {
      label: "عام",
      className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    },
    exams: {
      label: "امتحانات",
      className: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    },
    events: {
      label: "فعاليات",
      className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    },
    meetings: {
      label: "اجتماعات",
      className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    },
    urgent: {
      label: "عاجل",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
  }
  const c = config[category] ?? { label: category, className: "bg-gray-100 text-gray-600" }
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", c.className)}>{c.label}</span>
}

// ─── Child Avatar / Initials ───────────────────────────────────────

function ChildAvatar({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const initials =
    parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white shadow-sm">
      {initials}
    </span>
  )
}

// ─── Child Overview Card ───────────────────────────────────────────

interface ChildStat {
  child: {
    id: number
    user?: { name: string }
    enrollment_date?: string
    date_of_birth?: string
    gender?: string
  }
  memorization: {
    total_verses_memorized: number
    total_verses_revised: number
    average_performance_score: number
    total_sessions: number
  }
  attendance: {
    present: number
    absent: number
    total: number
    attendance_percentage: number
  }
}

function ChildOverviewCard({
  stat,
  isSelected,
  onClick,
}: {
  stat: ChildStat
  isSelected: boolean
  onClick: () => void
}) {
  const name = stat.child?.user?.name ?? `طالب #${stat.child.id}`
  const attPct = stat.attendance.attendance_percentage
  const memScore = stat.memorization.average_performance_score

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border-2 p-4 text-right transition-all",
        "hover:shadow-md",
        isSelected
          ? "border-primary bg-primary/5 shadow-[var(--shadow-soft)]"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      <div className="flex items-center gap-3">
        <ChildAvatar name={name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-foreground">{name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookMarked className="h-3.5 w-3.5" />
              {stat.memorization.total_verses_memorized} آية
            </span>
            <span className="flex items-center gap-1">
              <CalendarCheck className="h-3.5 w-3.5" />
              {attPct}% حضور
            </span>
            <span className={cn("flex items-center gap-1 font-medium", performanceScoreColor(memScore))}>
              <Star className="h-3.5 w-3.5" />
              {memScore}%
            </span>
          </div>
        </div>
        <div className="shrink-0 text-left">
          <div
            className={cn(
              "grid h-9 w-9 place-items-center rounded-lg text-sm font-bold",
              attPct >= 80
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : attPct >= 50
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            )}
          >
            {attPct}%
          </div>
        </div>
      </div>
    </button>
  )
}

// ─── Main Component ────────────────────────────────────────────────

export function ParentDashboard() {
  const { user } = useAuth()
  const firstName = (user?.name || "").split(" ")[0]

  // Dashboard data (contains children_stats)
  const { data: dashboardData, isLoading: dashLoading } = useQuery({
    queryKey: ["dashboard", "parent"],
    queryFn: () => dashboardApi.get(),
  })

  // Memorization records for all children
  const { data: memorizations, isLoading: memLoading } = useQuery({
    queryKey: ["memorizations", "my"],
    queryFn: () => memorizationApi.myList(),
  })

  // Attendance records for all children
  const { data: attendances, isLoading: attLoading } = useQuery({
    queryKey: ["attendance", "my"],
    queryFn: () => attendanceApi.myList(),
  })

  // Exam results for all children
  const { data: examResults, isLoading: examLoading } = useQuery({
    queryKey: ["exam-results", "my"],
    queryFn: () => examResultApi.myList(),
  })

  // Certificates for all children
  const { data: certificates, isLoading: certLoading } = useQuery({
    queryKey: ["certificates", "my"],
    queryFn: () => certificateApi.myList(),
  })

  // Announcements
  const { data: announcements, isLoading: annLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => announcementApi.list(),
  })

  const childrenStats: ChildStat[] = dashboardData?.children_stats ?? []
  const [selectedChildIndex, setSelectedChildIndex] = useState(0)
  const selectedChild = childrenStats[selectedChildIndex]

  // Filter records for selected child
  const selectedChildId = selectedChild?.child?.id
  const childMemorizations: MemorizationTracking[] = selectedChildId
    ? (memorizations ?? []).filter((m: MemorizationTracking) => m.student_id === selectedChildId).slice(0, 5)
    : []
  const childAttendances: Attendance[] = selectedChildId
    ? (attendances ?? []).filter((a: Attendance) => a.student_id === selectedChildId).slice(0, 5)
    : []
  const childExamResults: ExamResult[] = selectedChildId
    ? (examResults ?? []).filter(
        (r: ExamResult) =>
          r.student_id === selectedChildId || r.exam_request?.student_id === selectedChildId,
      ).slice(0, 5)
    : []
  const childCertificates: Certificate[] = selectedChildId
    ? (certificates ?? []).filter((c: Certificate) => c.student_id === selectedChildId).slice(0, 5)
    : []

  // Attendance summary for selected child
  const attSummary = childAttendances.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1
      acc.total++
      return acc
    },
    { present: 0, absent: 0, late: 0, excused: 0, total: 0 } as Record<string, number>,
  )

  // Exam pass rate for selected child
  const passedExams = childExamResults.filter((r) => r.is_passed).length
  const totalChildExams = childExamResults.length

  // Recent announcements
  const recentAnnouncements: Announcement[] = (announcements ?? []).slice(0, 3)

  return (
    <div className="fade-in-up space-y-6">
      {/* Welcome Header */}
      <PageHeader
        title="لوحة تحكم ولي الأمر"
        description={
          firstName
            ? `مرحباً بعودتك، ${firstName}! 👋 تابع تقدّم أبنائك في الحفظ والدراسة.`
            : "مرحباً بعودتك! 👋"
        }
      />

      {/* Children Overview */}
      {dashLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : childrenStats.length === 0 ? (
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="py-10 text-center">
            <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-base font-medium text-foreground">لا يوجد أبناء مسجلون</p>
            <p className="mt-1 text-sm text-muted-foreground">
              لم يتم ربط أي طالب بحسابك بعد. يرجى التواصل مع إدارة المدرسة.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Child selector */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {childrenStats.map((stat, i) => (
              <ChildOverviewCard
                key={stat.child.id}
                stat={stat}
                isSelected={i === selectedChildIndex}
                onClick={() => setSelectedChildIndex(i)}
              />
            ))}
          </div>

          {/* Selected Child Name */}
          {selectedChild && (
            <div className="flex items-center gap-3 fade-in-up">
              <ChildAvatar name={selectedChild.child?.user?.name ?? ""} />
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {selectedChild.child?.user?.name ?? `طالب #${selectedChild.child.id}`}
                </h2>
                <p className="text-sm text-muted-foreground">تفاصيل التقدّم الأكاديمي</p>
              </div>
            </div>
          )}

          {/* Stats Cards Row for Selected Child */}
          {selectedChild && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="card-hover rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] fade-in-up stagger-1">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary">
                    <BookMarked className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">الآيات المحفوظة</p>
                    <p className="text-2xl font-bold tracking-tight text-foreground">
                      {selectedChild.memorization.total_verses_memorized}
                    </p>
                  </div>
                </div>
              </div>
              <div className="card-hover rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] fade-in-up stagger-2">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary">
                    <BookOpen className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">الآيات المراجعة</p>
                    <p className="text-2xl font-bold tracking-tight text-foreground">
                      {selectedChild.memorization.total_verses_revised}
                    </p>
                  </div>
                </div>
              </div>
              <div className="card-hover rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] fade-in-up stagger-3">
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      "grid h-12 w-12 shrink-0 place-items-center rounded-xl",
                      "bg-gradient-to-br from-primary/15 to-secondary/15",
                      performanceScoreColor(selectedChild.memorization.average_performance_score),
                    )}
                  >
                    <Star className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">متوسط الأداء</p>
                    <p className="text-2xl font-bold tracking-tight text-foreground">
                      {selectedChild.memorization.average_performance_score}%
                    </p>
                  </div>
                </div>
              </div>
              <div className="card-hover rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] fade-in-up stagger-4">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary">
                    <Target className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">جلسات الحفظ</p>
                    <p className="text-2xl font-bold tracking-tight text-foreground">
                      {selectedChild.memorization.total_sessions}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detail Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Memorization Sessions */}
            <Card className="shadow-[var(--shadow-card)] card-hover fade-in-up stagger-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  جلسات الحفظ
                </CardTitle>
              </CardHeader>
              <CardContent>
                {memLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-3/4" />
                  </div>
                ) : childMemorizations.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    <BookOpen className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    <p>لا توجد جلسات حفظ مسجلة.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {childMemorizations.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-lg border border-border/50 p-3 transition-colors hover:bg-accent/20"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {m.surah?.name || `الجزء ${m.juz || "—"}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(m.start_date || m.created_at).toLocaleDateString("ar-SA")}
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
                            <span
                              className={cn(
                                "text-xs font-medium",
                                performanceScoreColor(m.performance_score),
                              )}
                            >
                              {m.performance_score}%
                            </span>
                          </div>
                        )}
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

            {/* Attendance */}
            <Card className="shadow-[var(--shadow-card)] card-hover fade-in-up stagger-2">
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
                ) : childAttendances.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    <Clock className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    <p>لا توجد سجلات حضور.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 grid grid-cols-4 gap-2">
                      <div className="rounded-lg bg-emerald-50 p-2 text-center dark:bg-emerald-950/30">
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {selectedChild.attendance.present}
                        </p>
                        <p className="text-[10px] text-muted-foreground">حاضر</p>
                      </div>
                      <div className="rounded-lg bg-red-50 p-2 text-center dark:bg-red-950/30">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          {selectedChild.attendance.absent}
                        </p>
                        <p className="text-[10px] text-muted-foreground">غائب</p>
                      </div>
                      <div className="rounded-lg bg-amber-50 p-2 text-center dark:bg-amber-950/30">
                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                          {attSummary.late || 0}
                        </p>
                        <p className="text-[10px] text-muted-foreground">متأخر</p>
                      </div>
                      <div className="rounded-lg bg-blue-50 p-2 text-center dark:bg-blue-950/30">
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {attSummary.excused || 0}
                        </p>
                        <p className="text-[10px] text-muted-foreground">معذور</p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">نسبة الحضور</span>
                        <span className="font-semibold text-foreground">
                          {selectedChild.attendance.attendance_percentage}%
                        </span>
                      </div>
                      <Progress value={selectedChild.attendance.attendance_percentage} className="mt-1 h-2" />
                    </div>
                    <div className="space-y-1.5">
                      {childAttendances.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-accent/20"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-muted-foreground">
                              {new Date(a.date).toLocaleDateString("ar-SA", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                            {a.class?.name && (
                              <span className="truncate text-xs text-muted-foreground/60">
                                · {a.class.name}
                              </span>
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

            {/* Exam Results */}
            <Card className="shadow-[var(--shadow-card)] card-hover fade-in-up stagger-3">
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
                ) : childExamResults.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    <p>لا توجد نتائج امتحانات بعد.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 text-center dark:from-emerald-950/30 dark:to-emerald-900/20">
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {passedExams}
                        </p>
                        <p className="text-xs text-muted-foreground">ناجح</p>
                      </div>
                      <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100/50 p-3 text-center dark:from-red-950/30 dark:to-red-900/20">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {totalChildExams - passedExams}
                        </p>
                        <p className="text-xs text-muted-foreground">راسب</p>
                      </div>
                    </div>
                    {totalChildExams > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">نسبة النجاح</span>
                          <span className="font-semibold text-foreground">
                            {Math.round((passedExams / totalChildExams) * 100)}%
                          </span>
                        </div>
                        <Progress
                          value={Math.round((passedExams / totalChildExams) * 100)}
                          className="mt-1 h-2"
                        />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      {childExamResults.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-accent/20"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {r.exam_request?.hizb_count
                                ? `${r.exam_request.hizb_count} حزب`
                                : r.level?.name || "امتحان"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {r.evaluated_at
                                ? new Date(r.evaluated_at).toLocaleDateString("ar-SA")
                                : "—"}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            {examGradeBadge(r.is_passed, r.grade)}
                            {r.marks_obtained != null && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {r.marks_obtained} درجة
                              </p>
                            )}
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
          </div>

          {/* Certificates + Quick Actions Row */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Certificates */}
            <Card className="shadow-[var(--shadow-card)] card-hover fade-in-up stagger-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Medal className="h-5 w-5 text-primary" />
                  الشهادات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {certLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ) : childCertificates.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    <Medal className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    <p>لم يتم إصدار أي شهادات بعد.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {childCertificates.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-accent/20"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {c.certificate_type === "memorization" ? "شهادة حفظ" : c.certificate_type}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {c.hizb_count} حزب
                            {c.grade ? ` · تقدير: ${c.grade}` : ""}
                          </p>
                        </div>
                        <div className="shrink-0">
                          <Badge variant={c.is_verified ? "default" : "secondary"} className="text-xs">
                            {c.is_verified ? "موثقة" : "غير موثقة"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    <Link
                      to="/certificates"
                      className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      عرض كل الشهادات
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-[var(--shadow-card)] card-hover fade-in-up stagger-5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-5 w-5 text-primary" />
                  روابط سريعة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/memorizations"
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-gradient-to-b from-transparent to-accent/30 p-4 text-center transition-all hover:border-primary/30 hover:shadow-sm"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                      <BookMarked className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium text-foreground">الحفظ</span>
                    <span className="text-[10px] text-muted-foreground">تقدّم الأبناء</span>
                  </Link>
                  <Link
                    to="/attendance"
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-gradient-to-b from-transparent to-accent/30 p-4 text-center transition-all hover:border-primary/30 hover:shadow-sm"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                      <CalendarCheck className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium text-foreground">الحضور</span>
                    <span className="text-[10px] text-muted-foreground">حضور الأبناء</span>
                  </Link>
                  <Link
                    to="/exam-results"
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-gradient-to-b from-transparent to-accent/30 p-4 text-center transition-all hover:border-primary/30 hover:shadow-sm"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Award className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium text-foreground">الامتحانات</span>
                    <span className="text-[10px] text-muted-foreground">نتائج الأبناء</span>
                  </Link>
                  <Link
                    to="/certificates"
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-gradient-to-b from-transparent to-accent/30 p-4 text-center transition-all hover:border-primary/30 hover:shadow-sm"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Medal className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium text-foreground">الشهادات</span>
                    <span className="text-[10px] text-muted-foreground">شهادات الأبناء</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

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
        </>
      )}
    </div>
  )
}
