# Project Memory & Architecture Decision Record (ADR)

## Project Overview
* **System Name**: Coaching Management System (CMS)
* **Architecture**: Decoupled Two-Tier Monorepo (`backend/` and `frontend/`)
* **Backend**: Node.js 22, Express.js (TypeScript), Prisma 6 ORM, Supabase (PostgreSQL with transaction & session poolers)
* **Frontend**: React 18 (Vite SPA + TypeScript), Tailwind CSS 3.4, Lucide Icons, Sonner Notifications
* **Design Philosophy**: Minimalist, clean, boxy UI (low border radius `rounded-sm`/`4px`), 5 central semantic CSS variables for theme control.
* **Core Tenancy**: Single coaching institution with multiple physical/virtual campuses (Branch-anchored hierarchy).
* **Auth & RBAC**: Custom JWT authentication (Access & Refresh tokens) with automatic client rotation, role-based guards, and branch context isolation.

---

## Workspace Layout
```
cms/
├── memory.md                  # Persistent ADR & architecture memory ledger
├── rules.md                   # Strict engineering standards & RBAC rules
├── database_structure.md      # DB schema, relations, indexing, and Supabase config
├── database.md                # Quick pointer to database_structure.md
├── backend/                   # Standalone Express API + Prisma 6 + Supabase (Deploy to Render)
│   ├── .env                   # Live Supabase connection strings & JWT secrets
│   ├── prisma/
│   │   ├── schema.prisma      # 26 Models, 18 Enums, composite indexes
│   │   └── seed.ts            # Database seeder with demo institution, branches, users
│   └── src/
│       ├── types/             # Domain enums & API response types
│       ├── schemas/           # Zod validation schemas
│       ├── middleware/        # authGuard, roleGuard, branchContext, rateLimiter, errorHandler
│       ├── common/utils/      # identifierGenerator, apiResponse
│       └── modules/           # auth, admin, students, batches, finance, academic-ops, public, upload
└── frontend/                  # Standalone Vite + React SPA + Tailwind (Deploy to Vercel)
    ├── tailwind.config.ts     # 5-variable theme engine + boxy card radius (rounded-sm/4px)
    ├── src/
    │   ├── types/             # Frontend mirror types
    │   ├── index.css          # Semantic CSS tokens (:root & .dark)
    │   ├── lib/apiClient.ts   # Auto-refresh JWT interceptor & request queue
    │   ├── components/        # SonnerToaster, FileUpload, Modals, RoleRouteGuard
    │   ├── layouts/           # PublicLayout, AdminLayout, StudentLayout
    │   └── modules/           # auth, public, admin, student
```

---

## Architectural Decisions Log (ADR)

### ADR-001: Decoupled Deployable Directories (Zero Workspace Hassle)
* **Decision**: Maintain `backend` and `frontend` as completely self-contained, independent npm projects.
* **Rationale**: Eliminates symlink and package resolution issues when deploying `frontend` directly to **Vercel** (Root Directory: `frontend`) and `backend` directly to **Render** (Root Directory: `backend`). No monorepo build tools or complex workspace publishing required.

### ADR-002: Tenancy & Multi-Branch Scoping
* **Decision**: Single coaching institution with multiple physical/virtual branches.
* **Anchor**: Every operational entity (`Batch`, `Classroom`, `Attendance`, `FeeReceipt`, `Invoice`, `ExpenseRecord`) belongs to a `Branch`.
* **Super Admin**: Global scope (`branchId: null` or access to all branches).
* **Branch Admins / Staff / Teachers / Students**: Strictly scoped by `branchId` through middleware (`branchContext.ts`).

### ADR-003: Strict Role & Domain Boundary Separation
* **Decision**: Completely separate Admin, Teacher, and Student domains across DB profiles, backend controllers, and frontend routes/layouts.
* **Database**: `User` table holds authentication and base identity. Sub-profiles (`AdminProfile`, `TeacherProfile`, `StaffProfile`, `StudentProfile`) hold role-specific attributes.
* **Frontend**: `AdminLayout` (dense management navigation, metrics, batch/staff controls) vs. `StudentLayout` (personal progress, enrolled batches, scorecards, fees) vs. `TeacherLayout` (assigned batches, attendance entry, marksheet grading).

### ADR-004: Supabase Connection Pooling (IPv4 Compatible)
* **Decision**: 
  - `DATABASE_URL`: Supabase Transaction Pooler (Port 6543, `?pgbouncer=true&connection_limit=15`).
  - `DIRECT_URL`: Supabase Session Pooler (Port 5432) for schema migrations and DDL statements.
* **Rationale**: Resolves IPv4 reachability and prevents connection exhaustion under concurrency.

### ADR-005: 5-Variable Minimalist Theme System & Boxy UI
* **Decision**: Centrally control application styling with 5 CSS variables:
  1. `--bg-app`: Page canvas background
  2. `--surface`: Elevated cards, sidebars, modal containers
  3. `--text-main`: High-contrast typography and icons
  4. `--brand-primary`: Brand action buttons, active states, focus indicators
  5. `--accent`: Borders, dividers, subtle hover backgrounds
* **UI Shape Standard**: Boxy design with low border-radius (`rounded-sm`, 4px).
* **Notifications**: Sonner with prominent dismissal cross button (`closeButton: true`).

### ADR-006: Asset Upload System & Supabase Storage Integration
* **Decision**: Universal upload pipeline with dual-mode storage (`UploadService`):
  - Primary: Supabase Cloud Storage bucket (`cms-assets`).
  - Fallback: Local disk static storage (`backend/uploads/`) with cross-origin helmet resource policy.
  - Reusable frontend `FileUpload` component with upload progress, thumbnail preview, and automatic form input population.
* **Poster Slider System**: `posters` JSON array in `Institution` model; rendered as an interactive auto-rotating Hero Carousel on the landing page.

### ADR-007: Resilient API Client & Automatic Refresh Token Rotation
* **Decision**: Implement centralized `apiClient` (`frontend/src/lib/apiClient.ts`) wrapping native `fetch`:
  - Automatically attaches `Authorization: Bearer <token>` to all authenticated requests.
  - Intercepts HTTP 401 Unauthorized errors and executes refresh token rotation (`POST /api/v1/auth/refresh`).
  - Implements request queueing during active refresh to prevent duplicate concurrent refresh attempts.
  - Retries failed requests with new access tokens seamlessly without user logout or session disruption.

### ADR-008: Concurrency-Safe Identifier Generation
* **Decision**: All business-critical identifiers are deterministically generated via transactional sequences:
  - Invoices: `INV-YYYY-XXXXX`
  - Receipts: `RCPT-YYYY-XXXXX`
  - Student Roll Numbers: `YYYY-BR-XXXXX`
* **Concurrency Handling**: Transactions ensure isolation, with collision detection and retry fallbacks to eliminate race conditions under concurrent admissions and payments.

### ADR-009: Teacher Domain & Faculty Portal Architecture
* **Decision**: Provide faculty with a dedicated, focused `/teacher/*` portal and scoped API endpoints:
  - Teachers access their assigned batches (`batch.teacherId` or `batch.subjectTeachers`).
  - Direct access to class attendance marking and offline exam grading without administrative clutter or financial exposure.
  - Authorization enforced at the service layer: a teacher cannot view, edit, or grade batches outside their assignment.

---

## Roles Overview & Status

| Role | Status | Description |
| :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Active | Full global access across all branches, institutions, settings, branding, posters, payment channels, branches creation/deletion, all finances, teacher application approval. |
| **`BRANCH_ADMIN`** | Active | Scoped to assigned branch: students, teachers, batches, local invoices, payments, expense records. |
| **`TEACHER`** | Active | Dedicated `/teacher/*` portal with assigned batches, timetable routine editor, attendance taking/editing, exams & marksheet grading with publish/unpublish toggle, study materials, course circulars, and profile management. |
| **`APPLICANT`** | Active | Prospective teachers who register via public CTA; complete application form (`/teacher/apply`) with CV/education table and track status (`/teacher/application-status`) until admin approval. |
| **`STAFF`** | Partial | Exists in DB (`StaffProfile`), created via Admin, allowed in attendance, study materials, and fee collection routes. |
| **`STUDENT`** | Active | Dedicated `/student/*` portal, self-registration, dashboard, enrolled batches, exam scorecards, fee ledger, study materials, campus/course notices, referrals. |
| **`PARENT`** | Inactive / Future | Enum exists in DB; guardian data currently stored as flat fields on `StudentProfile`. |

---

## Seed Accounts Available
* **Super Admin**: `admin@apexcoaching.com` / `password123`
* **Branch Admin**: Created per branch from admin console
* **Teacher / Faculty**: `teacher@apexcoaching.com` / `password123`
* **Staff**: `staff1@apexcoaching.com` / `password123`, `staff2@apexcoaching.com` / `password123`
* **Student**: `student@apexcoaching.com` / `password123`

---

## Completed Milestones
- [x] Initialized architecture specification and decision ledger.
- [x] Configured independent, decoupled `backend/` and `frontend/` directories for seamless Vercel & Render deployments.
- [x] Configured live Supabase credentials in `backend/.env` with transaction and session pooling.
- [x] Synced Prisma schema (26 models, 18 enums) to live Supabase database with composite indexes.
- [x] Seeded database with demo institution, branches, admin, faculty, staff, student, courses, batches, and notices.
- [x] Frontend Vite + Tailwind 5-variable setup with boxy cards and Sonner (close cross button).
- [x] Public landing page (courses, upcoming batches, notices, inquiry desk, hero carousel, reviews).
- [x] Verified independent builds for both `backend` and `frontend`.
- [x] Implemented Student Admission & Profile Flow with roll number auto-generation.
- [x] Asset Upload Pipeline with Supabase Storage (`cms-assets` public bucket) & local fallback.
- [x] Full Super User Edit Capabilities (payment channels, multi-branch, faculty, staff, posters).
- [x] Fees, Accounts, Invoicing, Costing & Printable Vouchers (`INV-2026-XXXXX`, `RCPT-2026-XXXXX`).
- [x] Notice board system with circular modals and urgent alert banners.
- [x] Exam scheduling and rapid batch marksheet entry drawer with live letter grade and merit rank calculations.
- [x] Printable official student report card / scorecard and digital student ID card.
- [x] Student referral reward program (৳500/admission) with unique invite links and withdrawal desk.
- [x] Student Portal with left sidepanel, attendance tracker, and performance charts.
- [x] Dynamic browser tab title and favicon synchronization based on institution settings.
- [x] Automated test suite for identifier generator, auth service, batch service, and finance service (36/36 tests passing).
- [x] Removed obsolete audit roadmap document (`PROJECT_AUDIT_AND_IMPROVEMENT_ROADMAP.md`).
- [x] Synchronized `database_structure.md`, `rules.md`, and `memory.md`.
- [x] Implemented Prospective Teacher Application & Onboarding pipeline (`/teacher/register`, `/teacher/apply`, `/teacher/application-status`).
- [x] Built Super Admin Teacher Applications Desk in `TeachersManagement.tsx` (view applications, qualifications table, CV details, approve with campus assignment, or reject).
- [x] Developed comprehensive Teacher Portal (`/teacher/*`) with boxy layout, routine scheduler, attendance recording, exam creation & marksheet grading with **Publish / Unpublish toggle**.
- [x] Enforced exam result privacy: un-published exams remain strictly hidden from student portals and public landing page until published.
- [x] Created dedicated Student Notices Center (`/student/notices`) and updated `StudentLayout`.
- [x] Added public landing page "Apply as Faculty" CTA buttons on desktop navbar and mobile drawer.
- [x] Polished Teacher Portal UI (`TeacherLayout.tsx`): Removed redundant desktop topbar when sidepanel is active, moved notifications bell to sidebar, updated brand header to "Teacher Portal" (removed "Academic Operations"), added bottom user card showing avatar, full name, and email with direct navigation to `/teacher/profile`.
- [x] Streamlined Teacher Dashboard (`TeacherDashboard.tsx`): Added dedicated top Quick Actions bar (Attendance, Marksheets, Routine, Study Notes, Circulars) for rapid mobile/desktop access; cleaned up welcome banner (removed cluttered badges and verbose subtitles); stripped redundant KPI card subtexts and schedule empty state text.
- [x] Upgraded Faculty Profile & Public View (`TeacherProfilePage.tsx`): Introduced tabbed view between "Edit My Profile" (editing full name, phone, specialization, qualifications, bio, and avatar with live `localStorage` sync) and "Public Faculty View" (rich public preview with credentials, badges, active batches, and institutional verification).
- [x] Implemented Public Faculty Profile (`/faculty/:id` & `/api/v1/public/teachers/:id`): Allows students, parents, and prospective clients to review verified educator qualifications, bio, and active cohorts.
- [x] Full Application Dossier Display & Editing (`TeacherProfilePage.tsx` & `teacher.service.ts`): Fixed missing parent names (`fatherName`, `motherName`), DOB, religion, addresses (`presentAddress`, `permanentAddress`), and resolved field mapping for academic qualifications (`degree || exam`, `passingYear || year`, `board`, `institute`, `result`) across edit view, preview view, and public page (`FacultyProfilePage.tsx`).
- [x] Admin & Teacher Portal 100% Visual Parity (`AdminLayout.tsx`): Aligned brand headers, user profile cards, theme switcher position, and full-width sign out button with semantic `--accent` token; ensured settings 4-sub-options are initially collapsed (`useState(false)`).
- [x] Student Portal Re-Development & Modernization:
  - Synchronized `StudentLayout.tsx` with 100% visual and structural parity with Admin and Teacher layouts (root flex frame `flex h-screen bg-bg-app overflow-hidden`, brand header with `STUDENT PORTAL` badge, notification bell, user dock with inline theme toggle and full-width sign out).
  - Built dedicated `StudentAttendancePage.tsx` (`/student/attendance`) with KPI cards (attendance percentage, present, absent, late/excused), batch filter, and chronological attendance table, removing the duplicate render of dashboard.
  - Redesigned `StudentDashboard.tsx` with mobile-first 1-tap Quick Action Bar (`Attendance`, `Exam Scores`, `Fee Invoices`, `Study Notes`, `Notices`, `Digital ID`), streamlined greeting card, and enrolled batches cards.
  - Polished and standardized all student sub-pages (`StudentExamsPage.tsx`, `StudentFeesPage.tsx`, `StudentMaterialsPage.tsx`, `StudentNoticesPage.tsx`, `StudentProfilePage.tsx`, `StudentReferralsPage.tsx`) using semantic `--accent` tokens and minimal language.
