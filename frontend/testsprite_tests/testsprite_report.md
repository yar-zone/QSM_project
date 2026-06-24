# TestSprite MCP Test Report — QSM Frontend

---

## 1️⃣ Document Metadata

| Field | Value |
|---|---|
| **Project** | QSM — Quran School Management System (Frontend) |
| **Test Type** | Frontend (Playwright / Browser Automation) |
| **Server Mode** | Development (Vite, port 5173) |
| **Test Date** | 2026-06-24 |
| **Prepared By** | TestSprite MCP |
| **Total Test Cases** | 15 |
| **Passed** | 7 |
| **Failed** | 5 |
| **Blocked** | 3 |
| **Pass Rate** | 46.7% |

---

## 2️⃣ Requirement Validation Summary

### REQ-01 · Authentication

> Users must be able to sign in and be redirected to their role-based authenticated area. Unauthenticated access to protected routes must redirect to the auth flow. Incomplete login submissions must show validation feedback.

| TC | Title | Priority | Status |
|---|---|---|---|
| TC001 | Sign in and reach the dashboard | High | ❌ FAILED |
| TC002 | Block unauthenticated access to the dashboard | High | ✅ PASSED |
| TC003 | Block unauthenticated access to the students page | High | ✅ PASSED |
| TC004 | Block unauthenticated access to the teachers page | High | ✅ PASSED |
| TC015 | Show validation feedback for incomplete sign-in | High | ✅ PASSED |

**Summary:** Route-guard (unauthenticated redirect) works correctly for all protected pages. However, *successful* sign-in fails: submitting valid credentials navigates to a **404 "Page Not Found"** screen rather than the dashboard. This is the root cause of all downstream failures.

**TC001 – Root Cause:**
```
Submitting the login form (example@gmail.com / password123) redirects
to a 404 page ("الصفحة غير موجودة") on two separate attempts.
The /api/login call may be returning a non-200 response, or the
post-login redirect route is misconfigured.
```

---

### REQ-02 · Dashboard

> Authenticated users must be able to view dashboard statistics and key school metrics after signing in.

| TC | Title | Priority | Status |
|---|---|---|---|
| TC005 | View dashboard statistics after signing in | High | ✅ PASSED |

**Summary:** The dashboard page loads and displays statistics correctly when accessed in an already-authenticated session. The failure is limited to the *sign-in flow* reaching the dashboard (TC001).

---

### REQ-03 · Student Management

> Authenticated users must be able to browse the student roster, create new student records, and edit existing records.

| TC | Title | Priority | Status |
|---|---|---|---|
| TC007 | Open the students roster after signing in | High | 🚫 BLOCKED |
| TC010 | Create a new student record | High | 🚫 BLOCKED |
| TC012 | Edit an existing student record | High | ❌ FAILED |

**Summary:** All student management tests were blocked or failed because sign-in through the login form does not complete successfully (404 redirect). TC010 additionally revealed that a newly-registered teacher account is placed in a **pending-approval state**, showing "حسابك قيد المراجعة" (Account under review) which prevents access to student-creation controls.

---

### REQ-04 · Teacher Management

> Authenticated users must be able to access the teachers management area and view the list of teachers. Navigation to the teachers area must remain accessible after visiting other sections.

| TC | Title | Priority | Status |
|---|---|---|---|
| TC006 | Access teacher management after signing in | High | ❌ FAILED |
| TC008 | View teacher records from the teachers area | High | ❌ FAILED |
| TC009 | Review the teacher list after signing in | High | 🚫 BLOCKED |
| TC011 | Keep teachers area available after navigating from other school areas | High | ✅ PASSED |
| TC013 | Preserve access to teachers after visiting students | High | ✅ PASSED |
| TC014 | Return to the teachers area after using the dashboard | High | ❌ FAILED |

**Summary:** Navigation *between* authenticated sections (TC011, TC013) works correctly, indicating the routing logic is sound once authenticated. However, reaching the teachers area from an unauthenticated state via sign-in is consistently blocked by the 404 post-login redirect.

---

## 3️⃣ Coverage & Matching Metrics

| Metric | Value |
|---|---|
| Requirements covered | 4 / 4 (100%) |
| Test cases executed | 15 |
| Passed | 7 (46.7%) |
| Failed | 5 (33.3%) |
| Blocked | 3 (20.0%) |
| Auth-related failures | 8 (all trace to the same root cause) |
| Independent failures | 1 (TC010 — pending approval account state) |

### Pass/Fail Breakdown by Requirement

```
REQ-01 Authentication    ████░░░░░░  4/5 pass (80%)  ← TC001 fails
REQ-02 Dashboard         ██████████  1/1 pass (100%)
REQ-03 Student Mgmt      ░░░░░░░░░░  0/3 pass (0%)   ← all blocked by auth
REQ-04 Teacher Mgmt      ████░░░░░░  2/6 pass (33%)  ← most blocked by auth
```

---

## 4️⃣ Key Gaps / Risks

### 🔴 Critical — Post-Login 404 Redirect

**Affected tests:** TC001, TC006, TC008, TC009, TC012, TC014 (6 tests, 40% of suite)

After submitting the login form with `example@gmail.com / password123`, the application consistently redirects to a **404 "الصفحة غير موجودة"** page. This is the single highest-priority issue.

**Likely causes to investigate:**
- The backend `/api/login` endpoint may not be reachable from the test environment (TestSprite uses placeholder credentials — the app needs real seeded credentials).
- The `LOGIN_USER` / `LOGIN_PASSWORD` placeholders in the test plan may not have been replaced with actual working credentials.
- The post-authentication redirect route in TanStack Router may be misconfigured (e.g., redirecting to a route that doesn't exist yet).
- CORS or session/cookie configuration between the Vite dev server (port 5173) and Laravel (port 8000) may be rejecting the login request.

> **Recommended fix:** Seed the database with a known user (e.g., `admin@qsm.test` / `password`) and re-run the test suite with those credentials supplied via the TestSprite login config.

---

### 🟡 Medium — Pending Approval Account State (TC010)

**Affected test:** TC010 — Create a new student record

A newly-registered teacher account is placed in a **pending-approval state** ("حسابك قيد المراجعة"), which blocks access to student-creation controls. This is likely expected business logic but means:
- Tests that register a new account cannot proceed without an admin approving it.
- The test plan should use a **pre-approved admin/staff account** for seeded test data.

---

### 🟡 Medium — Test Credentials Not Configured

TestSprite used placeholder credentials (`example@gmail.com / password123`). For future runs, configure real credentials by setting `LOGIN_USER` and `LOGIN_PASSWORD` in the TestSprite environment or project config. This will allow all 8 currently-failing/blocked tests to execute their actual assertions.

---

### 🟢 Positive Findings

- ✅ **Route guards work correctly** — All three unauthenticated-redirect tests (TC002, TC003, TC004) passed.
- ✅ **In-app navigation is solid** — Cross-section navigation (students ↔ teachers ↔ dashboard) works once authenticated (TC011, TC013).
- ✅ **Validation feedback is present** — Incomplete login form submission shows proper UI feedback (TC015).
- ✅ **Dashboard renders correctly** — Statistics and content display properly when the session is already authenticated (TC005).
