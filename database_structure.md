# Database Structure & Supabase Configuration

This document specifies the database architecture, entity relationships, indexing strategy, and connection pooling guidelines for the Coaching Management System (CMS).

---

## 1. Supabase Connection Configuration (Prisma 6)

In your `backend/.env` file, configure the two required database connection strings:

```env
# 1. Transaction Pooler (Port 6543) - Used by the Node.js API runtime
DATABASE_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=15"

# 2. Direct Session Connection (Port 5432) - Used for Prisma migrations
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
                      └───────────────┬───────────────┘
                                      │ 1:N
                      ┌───────────────▼───────────────┐
                      │            Branch             │
                      └───────┬───────────────┬───────┘
                              │ 1:N           │ 1:N
              ┌───────────────▼─────────┐   ┌─▼───────────────────────┐
              │          User           │   │         Course          │
              │  (Identity & Credentials│   └─┬───────────────────────┘
              └───────┬─────────────────┘     │ 1:N
                      │ 1:1                   │
      ┌───────────────┼───────────────┐       │
      │               │               │       │
┌─────▼────────┐┌─────▼────────┐┌─────▼───────▼┐
│ AdminProfile ││TeacherProfile││StudentProfile│
└──────────────┘└──────────────┘└─────┬────────┘
                                      │ M:N via BatchEnrollment
                                ┌─────▼────────┐
                                │    Batch     │
                                └─────┬────────┘
                                      │ 1:N
                       ┌──────────────┴──────────────┐
                       │                             │
                 ┌─────▼────────┐              ┌─────▼────────┐
                 │  Attendance  │              │     Exam     │
                 └──────────────┘              └─────┬────────┘
                                                     │ 1:N
                                               ┌─────▼────────┐
                                               │  ExamResult  │
                                               └──────────────┘
```

---

## 3. Core Models & Enums

### Enums
```prisma
enum UserRole {
  SUPER_ADMIN
  BRANCH_ADMIN
  TEACHER
  STAFF
  STUDENT
  PARENT
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum EnrollmentStatus {
  APPLIED
  ACTIVE
  ON_HOLD
  COMPLETED
  DROPPED
}

enum BatchStatus {
  UPCOMING
  ONGOING
  COMPLETED
  CANCELLED
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  EXCUSED
}

enum FeeStatus {
  PENDING
  PAID
  PARTIALLY_PAID
  OVERDUE
  WAIVED
}
```

### Models Summary

| Model | Purpose | Critical Indexes |
| :--- | :--- | :--- |
| `Institution` | Root coaching organization settings, branding, defaults | `id` |
| `Branch` | Multi-branch locations (e.g., Main Branch, Dhanmondi, Uttara) | `code`, `institutionId` |
| `User` | Global authentication, email, phone, role, password hash, refresh tokens | `email`, `phone`, `[branchId, role]` |
| `AdminProfile` | Admin designation, specific permissions | `userId` |
| `TeacherProfile`| Faculty qualifications, bio, subjects taught | `userId` |
| `StudentProfile`| Student academic details, roll no, parents, guardian, class, school, referral code | `userId`, `[guardianPhone]`, `referralCode (UNIQUE)` |
| `Course` | Available courses (can be featured on public landing page) | `[branchId, isPublic, isPublished]` |
| `Batch` | Specific scheduled group of students for a course | `[branchId, courseId, status]` |
| `BatchEnrollment`| Join table mapping StudentProfile to Batch | `[studentId, batchId] (UNIQUE)` |
| `Attendance` | Class-by-class attendance logs | `[batchId, date]`, `[studentId, date]` |
| `Exam` | Tests, quizzes, mock exams with subject and examType | `[batchId, examDate]` |
| `ExamResult` | Individual student scores, letter grade, rank, and pass status | `[examId, studentId] (UNIQUE)` |
| `FeeStructure` | Reusable tuition and exam fees catalog per batch or course | `[branchId, isActive]` |
| `FeeDiscount` | Waivers and discount grants (percentage or fixed amount) | `[batchId, studentId]` |
| `StudentInvoice` | Formal student invoices with auto-generated numbers and balances | `[studentId, status]`, `[branchId, status]` |
| `PaymentTransaction` | Individual payments with unique receipt vouchers and TrxIDs | `[invoiceId, transactionDate]`, `receiptNumber (UNIQUE)` |
| `ExpenseRecord` | Categorized coaching operational expenses and costing logs | `[branchId, expenseDate]` |
| `PublicNotice` | Campus, batch, or public notices with priority and attachments | `[branchId, isPublic, publishedAt]` |
| `ReferralPayout` | Student referral commission withdrawal requests and settlements | `[studentId, status]` |
| `StudyMaterial`| Digital lecture notes, question banks, syllabi (PDF, docx, links) | `[batchId]`, `[courseId]`, `[branchId]` |

---

## 4. Scalability & High-Volume Strategy

1. **Composite Indexes**:
   Queries in the CMS will frequently filter by `branchId` + `status` or `batchId` + `date`. Composite indexes prevent sequential table scans.
2. **Attendance & Audit Scaling**:
   Attendance tables grow rapidly. Adding composite indexes `@@index([batchId, date])` and `@@index([studentId, date])` ensures rapid lookups on monthly report generation.
3. **Soft-Delete Performance**:
   Where `deletedAt` is used, filter queries using partial indexing or compound indexes like `@@index([branchId, deletedAt])`.
