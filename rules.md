# Engineering Rules & Guidelines

These engineering rules are strictly enforced across the entire codebase to maintain high performance, avoid technical debt, prevent code duplication, and ensure rock-solid domain and role isolation.

---

## 1. Zero Code Duplication & Contract Consistency

1. **Self-Contained Contracts**:
   * `backend/src/types` and `frontend/src/types` hold identical domain enums (`UserRole`, `BatchStatus`, `FeeStatus`, `InvoiceStatus`, `PaymentMethod`, `ExamType`) and envelope types (`ApiResponse<T>`).
   * Keeping them self-contained ensures zero build or symlink friction when deploying `frontend` to **Vercel** and `backend` to **Render**.
2. **Universal Validation (Zod)**:
   * Validation schemas for auth, student admissions, branch creation, batch scheduling, etc. reside in `backend/src/schemas` and domain module schemas (`*.schema.ts`).
   * The backend validates payloads via `validateRequest(schema)` middleware.
   * Frontend forms mirror these validation requirements.
3. **Utility Functions**:
   * Pure helpers (date formatters, currency formatters, identifier generators) reside in their respective `common/utils` or `lib/` directories without cross-repo entanglements.

---

## 2. Role & Domain Isolation (RBAC Matrix)

The application enforces a multi-tiered Role-Based Access Control (RBAC) model:

| Role | Frontend Entry & Layout | Backend Scoping & Route Guard | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **`SUPER_ADMIN`** | `/admin/*` via `AdminLayout` | `roleGuard([SUPER_ADMIN])`, global branch context | Full institution management, settings, branding, posters, payment channels, branches creation/deletion, all finances, all reports. |
| **`BRANCH_ADMIN`** | `/admin/*` via `AdminLayout` | `roleGuard([SUPER_ADMIN, BRANCH_ADMIN])`, scoped by `req.branchContext` | Assigned campus management: student admissions, teacher creation, batch management, local billing, expense recording, notices. |
| **`TEACHER`** | `/teacher/*` via `TeacherLayout` | `roleGuard([TEACHER])`, scoped to assigned batches (`batch.teacherId` or `subjectTeachers`) | View assigned batches, student rosters, mark/edit attendance for assigned classes, schedule exams, enter marksheets/grades, upload study materials. |
| **`STAFF`** | `/staff/*` or desk routes | `roleGuard([SUPER_ADMIN, BRANCH_ADMIN, STAFF])` | Front-desk admission verification, fee collection desk, payment receipts, attendance logging. |
| **`STUDENT`** | `/student/*` via `StudentLayout` | `roleGuard([STUDENT])`, scoped to `req.user.userId` | Personal dashboard, enrolled classes, schedule routine, attendance history, exam scorecards, fee ledger, study materials, referral program. |
| **`PARENT`** | Standalone guardian view (planned) | Scoped to linked student profiles | Review student attendance alerts, published scorecards, fee payment dues. |

### Architectural Rules for Role Isolation:
1. **Controller Isolation**:
   * Domain actions must have dedicated controllers and routes.
   * Admin actions (`/api/v1/admin/*`), Teacher actions (`/api/v1/teacher/*`), and Student actions (`/api/v1/student/*`) MUST NEVER mix business logic.
2. **Layout & Navigation Separation**:
   * Each role runs in its dedicated layout protected by `RoleRouteGuard(['ROLE'])`.
   * Unauthorized access attempts must redirect the user to their legitimate home portal (e.g. Students to `/student`, Teachers to `/teacher`, Admins to `/admin`).
3. **Database Profile Separation**:
   * The `User` model handles identity, email/phone, password hash, role, and branch assignment.
   * Domain-specific attributes live strictly inside sub-profiles: `AdminProfile`, `TeacherProfile`, `StaffProfile`, `StudentProfile`.

---

## 3. Backend Architecture Standards (Modular Monolith)

1. **Layered Structure inside Every Module**:
   ```
   src/modules/<domain>/
   ├── <domain>.routes.ts       # Endpoint declarations & middleware attachment
   ├── <domain>.controller.ts   # HTTP request handling, status codes, DTO passing
   ├── <domain>.service.ts      # Pure business logic, calculations, workflow
   └── <domain>.schema.ts       # Zod validation schemas
   ```
2. **No Prisma in Controllers**:
   * Controllers NEVER directly invoke `prisma.<model>`. All database queries must run through the module's service layer.
3. **Standardized API Response**:
   * Every endpoint must return the standard envelope:
     ```typescript
     interface ApiResponse<T = any> {
       success: boolean;
       message?: string;
       data?: T;
       errors?: any;
     }
     ```
4. **Multi-Branch Tenant Scoping & IDOR Prevention**:
   * Every query involving branch-specific entities must apply `where: { branchId }` unless the authenticated user is `SUPER_ADMIN`.
   * Teachers and Staff can only mutate resources (e.g. attendance, exams, grades) belonging to their explicitly assigned batches or campuses.
   * Never trust client-supplied branch or user IDs blindly; always cross-verify against `req.user` and `req.branchContext`.

---

## 4. Frontend & UI/UX Standards

1. **5-Variable Central Theme**:
   * Components MUST ONLY use colors mapped to the 5 root CSS variables:
     - `--bg-app`: Page canvas background
     - `--surface`: Elevated cards, sidebars, modal containers
     - `--text-main`: High-contrast typography and icons
     - `--brand-primary`: Brand action buttons, active states, focus indicators
     - `--accent`: Borders, dividers, subtle hover backgrounds
   * Do NOT hardcode arbitrary colors (e.g., avoid `bg-[#1a2b3c]`).
2. **Boxy UI Aesthetic**:
   * Cards, buttons, inputs, dialogs, and panels must have a **low border radius**:
     - Standard: `rounded-sm` (2px) or `rounded-md` / `rounded-[4px]`.
     - Avoid pill-shaped buttons (`rounded-full`) or bubbly cards (`rounded-2xl`/`rounded-3xl`).
3. **Sonner Notification Rule**:
   * Always include the immediate dismissal cross button (`closeButton: true`).
   * Never fire multiple stacking toast errors for a single form submission; aggregate errors or show top-level summary.
4. **Centralized Data Fetching & Interceptors (`apiClient`)**:
   * All API calls must route through `apiClient` (`src/lib/apiClient.ts`).
   * `apiClient` automatically attaches `Authorization: Bearer <token>`, catches 401 Unauthorized responses, executes background refresh token rotation (`/auth/refresh`), queues concurrent requests, and retries failed calls seamlessly.

---

## 5. Database & Supabase Performance Rules

1. **Connection Pooling**:
   * In production, all API queries MUST route through Supabase's transaction pooler (port 6543, `?pgbouncer=true`).
   * Prisma migrations use the direct session connection string (`DIRECT_URL`, port 5432).
2. **Index Everything You Filter or Join**:
   * Always add composite indexes for common filter combinations: `@@index([branchId, status])`, `@@index([batchId, date])`, `@@index([studentId, date])`.
3. **Deterministic Identifier Generation**:
   * Sequential codes (roll numbers, invoice numbers, receipts) must be generated within transactions or with unique constraint collision retries. Never rely on naked `prisma.count() + 1` without concurrency protection.
4. **Soft Deletion**:
   * Critical operational tables (`User`, `StudentProfile`, `Course`, `Batch`) use `deletedAt DateTime?`.
   * Never hard-delete financial or attendance history.
