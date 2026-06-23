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
  admin: "Administrator",
  organizer: "Organizer",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin: "Full access to the entire platform.",
  organizer: "Manage students, teachers, exams and announcements.",
  teacher: "Track memorization, attendance and evaluations.",
  student: "Follow your memorization journey and results.",
  parent: "Monitor your child's progress and activities.",
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
