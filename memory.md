# Project Memory & Architecture Decision Record (ADR)

## Project Overview
* **System Name**: Coaching Management System (CMS)
* **Architecture**: Decoupled Two-Tier Monorepo (`backend/` and `frontend/`)
* **Backend**: Node.js, Express.js (TypeScript), Prisma 6 ORM, Supabase (PostgreSQL)
* **Frontend**: React (Vite SPA + TypeScript), Tailwind CSS, Lucide Icons, Sonner
* **Design Philosophy**: Minimalist, clean, boxy UI (low border radius `rounded-sm`/`4px`), 5 central semantic CSS variables for theme control.
* **Core Tenancy**: Single coaching center with multiple branches (Branch-anchored hierarchy).
* **Auth**: Express-driven custom JWT auth (Access & Refresh tokens) with fallback to Supabase credentials, full custom RBAC.

---

## Workspace Layout
```
cms/
├── memory.md                  # Persistent ADR & architecture memory ledger
├── rules.md                   # Strict engineering standards & zero-duplication rules
├── database_structure.md      # DB schema, relations, indexing, and Supabase config
├── backend/                   # Standalone Express API + Prisma 6 + Supabase (Deploy to Render)
│   ├── .env                   # Live Supabase connection strings & JWT secrets
│   ├── prisma/
│   │   ├── schema.prisma      # Models: Institution, Branch, User, Profiles, Courses, Batches
│   │   └── seed.ts            # Database seeder with demo accounts & branches
│   └── src/
│       ├── types/             # Domain enums & API response types
│       ├── schemas/           # Zod validation schemas
│       ├── middleware/        # authGuard, roleGuard, branchContext, validateRequest
│       └── modules/           # auth, admin, students, public, branches
└── frontend/                  # Standalone Vite + React SPA + Tailwind (Deploy to Vercel)
    ├── tailwind.config.ts     # 5-variable theme engine + boxy card radius (rounded-sm/4px)
    ├── src/
    │   ├── types/             # Frontend mirror types
    │   ├── index.css          # Semantic CSS tokens (:root & .dark)
    │   ├── components/ui/     # SonnerToaster (closeButton: true enabled)
    │   ├── layouts/           # PublicLayout, AdminLayout, StudentLayout
    │   └── modules/           # LandingPage, AdminDashboard, StudentDashboard, LoginPage
```

---

## Architectural Decisions Log (ADR)

### ADR-001: Decoupled Deployable Directories (Zero Workspace Hassle)
* **Decision**: Maintain `backend` and `frontend` as completely self-contained, independent npm projects.
* **Rationale**: Eliminates symlink and package resolution issues when deploying `frontend` directly to **Vercel** (Root Directory: `frontend`) and `backend` directly to **Render/Railway** (Root Directory: `backend`). No monorepo build tools or complex workspace publishing required.

### ADR-002: Tenancy & Multi-Branch Scoping
* **Decision**: Single coaching institution with multiple physical/virtual branches.
* **Anchor**: Every academic entity (`Batch`, `Classroom`, `Attendance`, `FeeReceipt`) belongs to a `Branch`.
* **Super Admin**: Has global scope (`branchId: null` or access to all branches).
* **Branch Admins / Staff / Teachers / Students**: Strictly scoped by `branchId` through middleware (`branchContext.ts`).

### ADR-003: Strict Separation of Admin and Student Domains
* **Decision**: Completely separate Admin and Student domains across DB profiles, backend controllers, and frontend routes/layouts.
* **Database**: `User` table holds authentication and base identity. Sub-profiles (`AdminProfile`, `TeacherProfile`, `StudentProfile`) hold role-specific attributes.
* **Frontend**: `AdminLayout` (dense navigation, metrics, batch/staff controls) vs. `StudentLayout` (focused, progress-oriented, schedule, fees).

### ADR-004: Supabase Connection Pooling (IPv4 Compatible)
* **Decision**: 
  - `DATABASE_URL`: Supabase Transaction Pooler (`aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true`).
  - `DIRECT_URL`: Supabase Session Pooler (`aws-0-ap-south-1.pooler.supabase.com:5432/postgres`) for schema migrations and DDL statements.
* **Rationale**: Solves IPv4 reachability and prevents connection exhaustion.

### ADR-005: 5-Variable Minimalist Theme System & Boxy UI
* **Decision**: Centrally control application styling with 5 CSS variables:
  1. `--bg-app`: Page canvas background
  2. `--surface`: Elevated cards, sidebars, modal containers
  3. `--text-main`: High-contrast typography and icons
  4. `--brand-primary`: Brand action buttons, active states, focus indicators
  5. `--accent`: Borders, dividers, subtle hover backgrounds
* **UI Shape Standard**: Boxy card design with low border-radius (`rounded-sm`, 4px).
* **Notifications**: Sonner with prominent dismissal cross button (`closeButton: true`).

---

### ADR-006: Asset Upload System & Supabase Storage Integration
* **Decision**: Universal upload pipeline with dual-mode storage (`UploadService`):
  - Primary: Supabase Cloud Storage bucket (`cms-assets`).
  - Fallback: Local disk static storage (`backend/uploads/`) with cross-origin helmet resource policy.
  - Reusable frontend `FileUpload` component with live upload progress, thumbnail preview, and automatic form input population.
* **Poster Slider System**: `posters` JSON array in `Institution` model; rendered as an interactive auto-rotating Hero Carousel with custom title, subtitle, CTA button, and responsive controls on the public landing page.

---

## Seed Accounts Available
* **Super Admin**: `admin@apexcoaching.com` / `password123`
* **Student**: `student@apexcoaching.com` / `password123`

---

## Completed Milestones
- [x] Initialized architecture specification and decision ledger.
- [x] Defined `rules.md` and `database_structure.md`.
- [x] Configured independent, decoupled `backend/` and `frontend/` directories for seamless Vercel & Render deployments.
- [x] Configured live Supabase credentials in `backend/.env`.
- [x] Synced Prisma schema to live Supabase database with composite indexes.
- [x] Seeded database with demo institution, branches, admin, student, courses, batches, and notices.
- [x] Frontend Vite + Tailwind 5-variable setup with boxy cards and Sonner (close cross button).
- [x] Public landing page (courses, upcoming batches, notices, inquiry desk).
- [x] Verified independent builds for both `backend` and `frontend`.
- [x] Implemented Student Admission & Profile Flow:
  - Admin creation with email as default password and roll number assignment.
  - Public student self-registration with strong password enforcement.
  - In-profile password update lifecycle and credential verification.
- [x] Asset Upload Pipeline with Supabase Storage (`cms-assets` public bucket) & local fallback.
- [x] Interactive Hero Carousel / Slider on Landing Page with auto-rotation, slide counter, and action buttons.
- [x] Full Super User Edit Capabilities:
  - Payment Channels: Edit modal for bKash, Nagad, Rocket, Bank accounts.
  - Multi-Branch: Edit Campus modal (`PUT /api/v1/admin/branches/:id`).
  - Faculty & Staff: Edit Faculty and Edit Staff modals (`PUT /api/v1/admin/teachers/:id`, `PUT /api/v1/admin/staffs/:id`).
  - Organization Posters: Add/Edit/Delete hero slides with file upload.
- [x] Phase 3: Fees, Accounts, Invoicing, Costing & Printable Vouchers:
  - Fee structures (Tuition, Admission, Model Tests) and scholarship discounts/waivers.
  - Automated batch invoicing engine (`INV-2026-XXXXX`).
  - Fee collection desk with authentic printable payment receipt voucher (`RCPT-2026-XXXXX`) featuring letterhead, breakdown, status stamps, and signature blocks.
  - Total operational costing tracker with categorization (rent, teacher honorariums, utilities, stationery).
  - Student self-service invoices and payment history portal.
- [x] Phase 4: Notice Board, Exams & Grading Engine, and Referral Program:
  - Notice board system with public circulars, campus/batch filtering, priority levels (`NORMAL`, `HIGH`, `URGENT`), and Supabase document attachments.
  - Interactive circular modal on landing page and urgent alert banner on student dashboard.
  - Exam scheduling and rapid batch marksheet entry drawer with live letter grade calculation (`A+` to `F`), pass/fail determinations, and automated batch merit rank assignment.
  - Printable official student report card / scorecard with grading scale and remarks.
  - Student referral reward program (৳500/admission) with unique invite links, commission tracking, and withdrawal requests.
  - Admin referral payout processing desk with bKash/Nagad/Rocket/Cash transaction verification and status settlement.
- [x] Student Portal Overhaul & Multi-Step Registration:
  - Converted student layout to fixed Left Sidepanel with arrow indicators for sub-action routes and bottom profile dock (avatar, name, email, theme switch, logout).
  - Multi-step student registration wizard: Step 1 (account credentials with show/hide password) and Step 2 (personal, guardian, academic class, school name, and auto-linked referral code from `?ref=...`).
  - Login page enhanced with show/hide password toggle, forgot password link positioned below password field, and register CTA.
  - Student dashboard with batch-filtered attendance tracker and SVG exam percentage performance chart with pass mark threshold.
  - Dedicated Student Referrals Hub (`/student/referrals`) showing commission earnings, shareable link, and withdrawal requests.
