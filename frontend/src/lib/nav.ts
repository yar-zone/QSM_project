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
  { title: "لوحة التحكم", to: "/dashboard", icon: LayoutDashboard, roles: ["admin", "organizer", "teacher", "student", "parent"] },
  { title: "الموافقات", to: "/approvals", icon: UserCheck, roles: ["admin", "organizer"] },
  { title: "أولياء الأمور", to: "/parents", icon: Users, roles: ["admin", "organizer", "teacher", "parent"] },
  { title: "الطلاب", to: "/students", icon: GraduationCap, roles: ["admin", "organizer", "teacher"] },
  { title: "المعلمون", to: "/teachers", icon: Users, roles: ["admin", "organizer"] },
  { title: "الفصول", to: "/classes", icon: BookOpen, roles: ["admin", "organizer", "teacher"] },
  { title: "المستويات", to: "/levels", icon: LayoutList, roles: ["admin", "organizer"] },
  { title: "المواد", to: "/subjects", icon: BookMarked, roles: ["admin", "organizer"] },
  { title: "نتائج الامتحانات", to: "/exam-results", icon: Award, roles: ["admin", "organizer", "teacher", "student", "parent"] },
  { title: "الحفظ", to: "/memorizations", icon: BookMarked, roles: ["admin", "organizer", "teacher", "student", "parent"] },
  { title: "الحضور", to: "/attendance", icon: CalendarCheck, roles: ["admin", "organizer", "teacher", "student", "parent"] },
  { title: "الشهادات", to: "/certificates", icon: Award, roles: ["admin", "organizer", "teacher", "student", "parent"] },
  { title: "الإعلانات", to: "/announcements", icon: Bell, roles: ["admin", "organizer", "teacher", "student", "parent"] },
  { title: "الاجتماعات", to: "/meetings", icon: Video, roles: ["admin", "organizer", "teacher"] },
  { title: "المستخدمون", to: "/users", icon: Shield, roles: ["admin"] },
  { title: "ملفي الشخصي", to: "/profile", icon: User, roles: ["admin", "organizer", "teacher", "student", "parent"] },
]

export function navForRole(role: AppRole | null): NavItem[] {
  if (!role) return []
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}
