# Engineering Rules & Guidelines

These rules are strictly enforced across the entire codebase to maintain high performance, avoid technical debt, prevent code duplication, and ensure rock-solid domain isolation.

---

## 1. Zero Code Duplication & Contract Consistency

1. **Self-Contained Contracts**:
   * `backend/src/types` and `frontend/src/types` hold identical domain enums (`UserRole`, `BatchStatus`, `FeeStatus`) and response shapes (`ApiResponse<T>`).
   * Keeping them self-contained ensures zero build/symlink friction when deploying `frontend` directly to Vercel and `backend` directly to Render.
2. **Universal Validation (Zod)**:
   * Validation schemas for auth, student admissions, branch creation, batch scheduling, etc. reside in `backend/src/schemas`.
   * The backend validates payloads via `validateRequest(schema)` middleware.
   * Frontend forms mirror these schemas directly with `@hookform/resolvers/zod` or pure handlers.
3. **Utility Functions**:
   * Pure helpers (date formatters, currency formatters) must be placed in their respective `common/utils` or `lib/` directories without cross-repo entanglements.

---

## 2. Role & Domain Isolation (Admin vs. Student)

1. **Controller Isolation**:
   * Admin actions (`/api/v1/admin/*`) and Student actions (`/api/v1/student/*`) MUST have dedicated controllers and routes.
   * NEVER mix admin batch management with student batch viewing logic.
2. **Frontend Layout & Route Guard Separation**:
   * Admin routes run inside `AdminLayout` protected by `RoleRouteGuard(['SUPER_ADMIN', 'BRANCH_ADMIN'])`.
   * Student routes run inside `StudentLayout` protected by `RoleRouteGuard(['STUDENT'])`.
   * Public routes (course catalog, notices, inquiry) run inside `PublicLayout` with zero auth requirement.
3. **Database Profile Separation**:
   * The `User` model handles identity, email/phone, password hash, role, and branch assignment.
   * Specific domain properties live in dedicated sub-profile models:
     - `AdminProfile` (designation, permissions, notes)
     - `TeacherProfile` (qualification, subjects, salary config)
     - `StudentProfile` (guardian details, previous school, admission date, roll number)

---

## 3. Backend Architecture Standards (Modular Monolith)

1. **Layered Structure inside Every Module**:
   ```
   src/modules/<domain>/
   ├── <domain>.routes.ts       # Endpoint declarations & middleware attachment
   ├── <domain>.controller.ts   # HTTP request handling, status codes, DTO passing
   ├── <domain>.service.ts      # Pure business logic, calculations, workflow
   └── <domain>.repository.ts   # Prisma database interactions (optional or direct service call)
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
4. **Multi-Branch Tenant Scoping**:
   * Every query involving branch-specific entities must apply `where: { branchId }` unless the authenticated user is `SUPER_ADMIN`.
   * Always extract `branchId` from the authenticated request context (`req.branchContext`), never trust client-supplied branch parameters blindly.

---

## 4. Frontend & UI/UX Standards

1. **5-Variable Central Theme**:
   * Components MUST ONLY use colors mapped to the 5 root CSS variables:
     - `--bg-app`
     - `--surface`
     - `--text-main`
     - `--brand-primary`
     - `--accent`
   * Do NOT hardcode arbitrary colors (e.g., avoid `bg-[#1a2b3c]`). If a new semantic role is needed, discuss adding it centrally.
2. **Boxy UI Component Aesthetic**:
   * Cards, buttons, inputs, dialogs, and panels must have a **low border radius**:
     - Standard: `rounded-sm` (2px) or `rounded-md` / `rounded-[4px]`.
     - Avoid pill-shaped buttons (`rounded-full`) or bubbly cards (`rounded-2xl`/`rounded-3xl`).
3. **Sonner Notification Rule**:
   * Always include the immediate dismissal cross button (`closeButton: true`).
   * Never fire multiple stacking toast errors for a single form submission; aggregate errors or show top-level summary.
4. **Data Fetching & Server State**:
   * Use TanStack Query (React Query) for all server state.
   * Component-level `useEffect` for data fetching is STRICTLY FORBIDDEN.

---

## 5. Database & Supabase Performance Rules

1. **Connection Pooling**:
   * In production, all API queries MUST route through Supabase's transaction pooler (port 6543, `?pgbouncer=true`).
   * Prisma migrations use the direct connection string (`DIRECT_URL`, port 5432).
2. **Index Everything You Filter or Join**:
   * Always add composite indexes for common filter combinations: `@@index([branchId, status])`, `@@index([batchId, createdAt])`.
3. **Soft Deletion**:
   * Critical operational tables (`User`, `StudentProfile`, `Course`, `Batch`, `FeeReceipt`) use `deletedAt DateTime?`.
   * Never hard-delete financial or attendance history.
