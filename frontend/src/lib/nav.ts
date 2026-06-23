import {
  LayoutDashboard, UserCheck, User, Users, GraduationCap, BookOpen,
  LayoutList, BookMarked, ClipboardList, Award, Bell,
  Video, CalendarCheck, FileText, Shield, type LucideIcon,
} from "lucide-react"

import type { AppRole } from "@/lib/roles"

export interface NavItem {
  title: string
  to: string
  icon: LucideIcon
  roles: AppRole[]
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", to: "/dashboard", icon: LayoutDashboard, roles: ["admin", "organizer", "teacher", "student", "parent"] },
  { title: "Approvals", to: "/approvals", icon: UserCheck, roles: ["admin", "organizer"] },
  { title: "Parents", to: "/parents", icon: Users, roles: ["admin", "organizer", "teacher", "parent"] },
  { title: "Students", to: "/students", icon: GraduationCap, roles: ["admin", "organizer", "teacher"] },
  { title: "Teachers", to: "/teachers", icon: Users, roles: ["admin", "organizer"] },
  { title: "Classes", to: "/classes", icon: BookOpen, roles: ["admin", "organizer", "teacher"] },
  { title: "Levels", to: "/levels", icon: LayoutList, roles: ["admin", "organizer"] },
  { title: "Subjects", to: "/subjects", icon: BookMarked, roles: ["admin", "organizer"] },
  { title: "Exam Results", to: "/exam-results", icon: Award, roles: ["admin", "organizer", "teacher", "student", "parent"] },
  { title: "Memorization", to: "/memorizations", icon: BookMarked, roles: ["admin", "organizer", "teacher", "student", "parent"] },
  { title: "Attendance", to: "/attendance", icon: CalendarCheck, roles: ["admin", "organizer", "teacher", "student", "parent"] },
  { title: "Certificates", to: "/certificates", icon: Award, roles: ["admin", "organizer", "teacher", "student", "parent"] },
  { title: "Announcements", to: "/announcements", icon: Bell, roles: ["admin", "organizer", "teacher", "student", "parent"] },
  { title: "Meetings", to: "/meetings", icon: Video, roles: ["admin", "organizer", "teacher"] },
  { title: "Users", to: "/users", icon: Shield, roles: ["admin"] },
  { title: "My Profile", to: "/profile", icon: User, roles: ["admin", "organizer", "teacher", "student", "parent"] },
]

export function navForRole(role: AppRole | null): NavItem[] {
  if (!role) return []
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}
