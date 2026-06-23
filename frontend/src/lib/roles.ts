export const APP_ROLES = [
  "admin",
  "organizer",
  "teacher",
  "student",
  "parent",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type ApprovalStatus = "pending" | "approved" | "rejected";

/** Roles a visitor is allowed to choose when self-registering. */
export const SELF_SIGNUP_ROLES: readonly AppRole[] = [
  "teacher",
  "student",
] as const;

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "مدير",
  organizer: "منظم",
  teacher: "معلم",
  student: "طالب",
  parent: "ولي أمر",
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin: "وصول كامل للمنصة بأكملها.",
  organizer: "إدارة الطلاب والمعلمين والامتحانات والإعلانات.",
  teacher: "تتبع الحفظ والحضور والتقييمات.",
  student: "تابع رحلة حفظك ونتائجك.",
  parent: "راقب تقدم وأنشطة طفلك.",
};

/** Priority order used to pick a single primary role for routing/UI. */
const ROLE_PRIORITY: AppRole[] = [
  "admin",
  "organizer",
  "teacher",
  "student",
  "parent",
];

export function getPrimaryRole(roles: AppRole[]): AppRole | null {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return role;
  }
  return roles[0] ?? null;
}

export function isStaffRole(role: AppRole | null): boolean {
  return role === "admin" || role === "organizer";
}
