# Database Architecture & Supabase Specification

This document specifies the complete database architecture, entity-relationship models, enums, indexing strategy, and connection pooling guidelines for the Coaching Management System (CMS).

---

## 1. Supabase Connection Configuration (Prisma 6)

In `backend/.env`, two connection strings ensure high-performance pool handling and IPv4 reachability:

```env
# 1. Transaction Pooler (Port 6543) - Used by the Node.js Express API runtime
DATABASE_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=15"

# 2. Direct Session Connection (Port 5432) - Used for Prisma schema migrations and DDL operations
DIRECT_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

In `backend/prisma/schema.prisma`:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

---

## 2. Entity-Relationship Overview

```
                               ┌───────────────────────────────┐
                               │          Institution          │
                               │  (Root Coaching Organization) │
                               └───────┬───────────────┬───────┘
                                       │ 1:N           │ 1:N
                       ┌───────────────▼────────┐   ┌──▼────────────────────┐
                       │         Branch         │   │     AcademicClass     │
                       │   (Physical/Campus)    │   │ (School, College, Adm)│
                       └───────┬───────────────┬┘   └──┬────────────────────┘
                               │ 1:N           │ 1:N   │
               ┌───────────────▼─────────┐   ┌─▼───────▼───────────────┐
               │          User           │   │         Course          │
               │  (Global Auth & Identity│   │   (Subject/Curriculum)  │
               └───────┬─────────────────┘   └──┬──────────────────────┘
                       │ 1:1                    │ 1:N
       ┌───────────────┼───────────────┬────────┴──────┐
       │               │               │               │
┌──────▼───────┐┌──────▼────────┐┌─────▼────────┐┌─────▼────────┐
│ AdminProfile ││TeacherProfile ││ StaffProfile ││StudentProfile│
└──────────────┘└──────┬────────┘└──────────────┘└─────┬────────┘
                       │                               │
                       │ Assigns                       │ Enrolls via BatchEnrollment
                       │                               │
                       │         ┌──────────────┐      │
                       └────────►│    Batch     │◄─────┘
                                 └──────┬───────┘
                                        │ 1:N
                        ┌───────────────┼───────────────┐
                        │               │               │
                 ┌──────▼───────┐┌──────▼───────┐┌──────▼───────┐
                 │  Attendance  ││     Exam     ││StudyMaterial │
                 └──────────────┘└──────┬───────┘└──────────────┘
                                        │ 1:N
                                 ┌──────▼───────┐
                                 │  ExamResult  │
                                 └──────────────┘

Financial & Auxiliary Subsystems:
- FeeStructure (Course/Batch fee defaults)
- FeeDiscount (Merit/scholarship waivers)
- StudentInvoice (Auto-sequenced billing records)
- PaymentTransaction (Receipt vouchers with bKash/Nagad/Cash tracking)
- ExpenseRecord (Operational expense categorization & approvals)
- PublicNotice (Global, campus, or batch circulars)
- ReferralPayout (Student referral reward settlement)
- AdmissionInquiry (Public inquiry CRM)
- Testimonial (Student/Parent reviews)
- StudentAchievement (Hall of Fame)
- FacultyTip (Academic articles & study guides)
```

---

## 3. Enumerations

| Enum Name | Values | Purpose |
| :--- | :--- | :--- |
| `UserRole` | `SUPER_ADMIN`, `BRANCH_ADMIN`, `TEACHER`, `STAFF`, `STUDENT`, `PARENT` | System access control & domain boundary |
| `Gender` | `MALE`, `FEMALE`, `OTHER` | Demographic records |
| `ClassCategory` | `SCHOOL`, `COLLEGE`, `ADMISSION`, `PROFESSIONAL` | Level categorization of academic classes |
| `BatchFeeType` | `ONE_TIME`, `INSTALLMENT`, `MONTHLY` | Billing frequency for batch tuition |
| `EnrollmentStatus` | `APPLIED`, `PENDING_VERIFICATION`, `ACTIVE`, `ON_HOLD`, `WAITLISTED`, `CANCELLED_REFUND`, `COMPLETED`, `DROPPED` | Lifecycle of a student in a batch |
| `BatchStatus` | `UPCOMING`, `ONGOING`, `COMPLETED`, `CANCELLED` | Batch schedule state |
| `AttendanceStatus` | `PRESENT`, `ABSENT`, `LATE`, `EXCUSED` | Session attendance mark |
| `FeeStatus` | `PENDING`, `PAID`, `PARTIALLY_PAID`, `OVERDUE`, `WAIVED` | High-level student fee standing |
| `PaymentMethod` | `CASH`, `BKASH`, `NAGAD`, `ROCKET`, `BANK_TRANSFER`, `OTHER` | MFS / Banking payment gateway types |
| `InvoiceStatus` | `UNPAID`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `WAIVED`, `CANCELLED` | Formal invoice settlement status |
| `FeeFrequency` | `ONE_TIME`, `MONTHLY`, `QUARTERLY`, `PER_EXAM` | Billing recurring frequency |
| `DiscountType` | `PERCENTAGE`, `FLAT_AMOUNT` | Discount calculation model |
| `ExpenseCategory` | `RENT`, `UTILITIES`, `TEACHER_HONORARIUM`, `STAFF_SALARY`, `PRINTING_STATIONERY`, `EQUIPMENT_MAINTENANCE`, `MARKETING`, `OTHER` | Operational accounting classification |
| `ExpenseStatus` | `PENDING`, `APPROVED`, `REJECTED` | Multi-step expense approval workflow |
| `PaymentStatus` | `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED` | Transaction reconciliation state |
| `PayoutStatus` | `PENDING`, `APPROVED`, `PAID`, `REJECTED` | Referral withdrawal settlement status |
| `InquiryStatus` | `NEW`, `CONTACTED`, `ADMITTED`, `REJECTED` | Admission CRM lead status |
| `ExamType` | `MOCK_TEST`, `WEEKLY_QUIZ`, `MONTHLY_TEST`, `TERM_FINAL`, `PRACTICE` | Exam categorization |

---

## 4. Models Summary

| Model | Purpose | Primary Relations & Critical Indexes |
| :--- | :--- | :--- |
| `Institution` | Root coaching organization, branding, posters, payment channels | `id`, `code (UNIQUE)` |
| `Branch` | Campus locations (Main campus, Dhanmondi, Uttara, etc.) | `code (UNIQUE)`, `[institutionId, isActive]` |
| `User` | Global credentials, email/phone, password hash, role, refresh token | `email (UNIQUE)`, `phone (UNIQUE)`, `[branchId, role]`, `[role, isActive]` |
| `AdminProfile` | Admin designation and permission overrides | `userId (UNIQUE)` |
| `TeacherProfile` | Faculty qualification, specialization, bio | `userId (UNIQUE)` |
| `StaffProfile` | Non-teaching campus staff designation & department | `userId (UNIQUE)` |
| `StudentProfile` | Student academic records, roll number, guardian details, referral link | `userId (UNIQUE)`, `rollNumber (UNIQUE)`, `referralCode (UNIQUE)`, `[guardianPhone]` |
| `Course` | Academic curricula/courses offered across branches | `[branchId, code] (UNIQUE)`, `[branchId, isPublic, isPublished]` |
| `AcademicClass` | Standard classes (e.g., HSC 2026, SSC 2025, Pre-Medical) | `code (UNIQUE)`, `[category, academicYear]`, `[institutionId, academicYear]` |
| `Batch` | Scheduled student classroom cohorts with routines, limits, fees | `[branchId, status]`, `[academicClassId, status]`, `[courseId, status]` |
| `BatchEnrollment`| Join table linking StudentProfile to Batch with status & payment verification | `[batchId, studentId] (UNIQUE)`, `[batchId, status]`, `[studentId, status]` |
| `Attendance` | Class-by-class attendance logs | `[batchId, studentId, date] (UNIQUE)`, `[batchId, date]`, `[studentId, date]` |
| `Exam` | Tests, quizzes, mock exams with total & pass marks | `[batchId, examDate]` |
| `ExamResult` | Individual student scores, letter grades, rank, pass/fail status | `[examId, studentId] (UNIQUE)`, `[studentId]` |
| `PublicNotice` | Campus, batch, or public notices with attachments & priority | `[branchId, isPublic, publishedAt]`, `[batchId]` |
| `ReferralPayout`| Student referral commission withdrawal requests & settlement | `[studentId, status]` |
| `AdmissionInquiry`| Public website inquiry leads | `[status, createdAt]` |
| `Testimonial` | Moderated student and parent testimonials | `[isApproved, createdAt]` |
| `StudentAchievement`| Hall of fame student rankings & university placement cards | `[isFeatured, displayOrder]` |
| `FacultyTip` | Published academic articles, faculty guidelines, and tips | `slug (UNIQUE)`, `[isPublished, displayOrder]` |
| `StudyMaterial` | Digital PDFs, lecture notes, syllabus materials | `[batchId]`, `[courseId]`, `[branchId]` |
| `FeeStructure` | Reusable fee definitions per batch or course | `[branchId, isActive]`, `[batchId, isActive]` |
| `FeeDiscount` | Student scholarship grants or waivers | `[batchId, isActive]`, `[studentId, isActive]` |
| `StudentInvoice`| Auto-sequenced formal invoices (`INV-2026-XXXXX`) | `invoiceNumber (UNIQUE)`, `[studentId, status]`, `[batchId, status]`, `[branchId, status]`, `[dueDate]` |
| `PaymentTransaction`| Auto-sequenced payment vouchers (`RCPT-2026-XXXXX`) | `receiptNumber (UNIQUE)`, `[studentId, paidAt]`, `[branchId, paidAt]`, `[invoiceId, status]` |
| `ExpenseRecord` | Categorized campus operating expense ledger & approval logs | `[branchId, expenseDate]`, `[status, branchId]`, `[category]` |

---

## 5. High-Volume & Concurrency Architecture

1. **Deterministic Identifier Generation**:
   Invoice numbers (`INV-YYYY-XXXXX`), payment receipt numbers (`RCPT-YYYY-XXXXX`), and student roll numbers (`YYYY-BR-XXXXX`) are generated via database transactions with fallback collision retry mechanisms.
2. **Attendance Scaling**:
   Attendance records use a composite unique constraint `@@unique([batchId, studentId, date])` to prevent double-marking, coupled with `@@index([batchId, date])` and `@@index([studentId, date])` to accelerate batch sheets and student scorecards.
3. **Multi-Branch Query Isolation**:
   Every operational entity includes `branchId`. Queries by non-`SUPER_ADMIN` operators strictly enforce branch matching in the `where` clause.
