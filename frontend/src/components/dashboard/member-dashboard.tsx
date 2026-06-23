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
    { icon: BookOpen, title: "Memorization", desc: "Record Juz/Hizb progress and scores." },
    { icon: CalendarCheck, title: "Attendance", desc: "Track present, absent and excused." },
    { icon: Video, title: "Meetings", desc: "Schedule and launch Jitsi sessions." },
    { icon: BarChart3, title: "Statistics", desc: "Follow your students' progress." },
  ],
  student: [
    { icon: BookOpen, title: "My progress", desc: "Memorized surahs and hizbs." },
    { icon: Award, title: "Certificates", desc: "View and download your certificates." },
    { icon: CalendarCheck, title: "Attendance", desc: "Your attendance history." },
    { icon: Bell, title: "Announcements", desc: "Stay up to date." },
  ],
  parent: [
    { icon: BookOpen, title: "Child's progress", desc: "Track memorization and scores." },
    { icon: Award, title: "Certificates", desc: "View your child's certificates." },
    { icon: CalendarCheck, title: "Attendance", desc: "Your child's attendance history." },
    { icon: Bell, title: "Announcements", desc: "Stay up to date." },
  ],
  admin: [],
  organizer: [],
}

const DELAYS = ["stagger-1", "stagger-2", "stagger-3", "stagger-4"]

export function MemberDashboard({ role }: { role: "teacher" | "student" | "parent" }) {
  const { user } = useAuth()
  const titleMap = { teacher: "Teacher Dashboard", student: "Student Dashboard", parent: "Parent Dashboard" } as const
  const firstName = (user?.name || "").split(" ")[0]

  return (
    <div className="fade-in-up">
      <PageHeader title={titleMap[role]} description={firstName ? `Welcome back, ${firstName}.` : "Welcome back."} />
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
