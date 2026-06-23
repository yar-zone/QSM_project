import { BookOpen, Award, CalendarCheck, Video, Bell, BarChart3, type LucideIcon } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Role } from "@/types"

interface UpcomingModule {
  icon: LucideIcon
  title: string
  desc: string
}

const MODULES: Record<Role, UpcomingModule[]> = {
  teacher: [
    { icon: BookOpen, title: "الحفظ", desc: "سجل تقدم الأجزاء والأحزاب والدرجات." },
    { icon: CalendarCheck, title: "الحضور", desc: "تتبع الحضور والغياب والأعذار." },
    { icon: Video, title: "الاجتماعات", desc: "جدولة وإطلاق جلسات الاجتماعات." },
    { icon: BarChart3, title: "الإحصائيات", desc: "تابع تقدم طلابك." },
  ],
  student: [
    { icon: BookOpen, title: "تقدّمي", desc: "السور والأحزاب المحفوظة." },
    { icon: Award, title: "الشهادات", desc: "عرض وتنزيل شهاداتك." },
    { icon: CalendarCheck, title: "الحضور", desc: "سجل حضورك." },
    { icon: Bell, title: "الإعلانات", desc: "ابق على اطلاع." },
  ],
  parent: [
    { icon: BookOpen, title: "تقدّم الطفل", desc: "تتبع الحفظ والدرجات." },
    { icon: Award, title: "الشهادات", desc: "عرض شهادات طفلك." },
    { icon: CalendarCheck, title: "الحضور", desc: "سجل حضور طفلك." },
    { icon: Bell, title: "الإعلانات", desc: "ابق على اطلاع." },
  ],
  admin: [],
  organizer: [],
}

const DELAYS = ["stagger-1", "stagger-2", "stagger-3", "stagger-4"]

export function MemberDashboard({ role }: { role: "teacher" | "student" | "parent" }) {
  const { user } = useAuth()
  const titleMap = { teacher: "لوحة تحكم المعلم", student: "لوحة تحكم الطالب", parent: "لوحة تحكم ولي الأمر" } as const
  const firstName = (user?.name || "").split(" ")[0]

  return (
    <div className="fade-in-up">
      <PageHeader title={titleMap[role]} description={firstName ? `مرحباً بعودتك، ${firstName}.` : "مرحباً بعودتك."} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES[role].map((m, i) => (
          <Card key={m.title} className={`card-hover shadow-[var(--shadow-card)] fade-in-up ${DELAYS[i]}`}>
            <CardHeader className="pb-2">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-primary/15 to-secondary/15 text-primary">
                <m.icon className="h-5 w-5" />
              </span>
              <CardTitle className="pt-2 text-base">{m.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{m.desc}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
