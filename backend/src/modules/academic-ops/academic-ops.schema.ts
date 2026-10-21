import { z } from "zod";
import { PaymentMethod } from "../../types/index.js";

const emptyToNull = (val: unknown) =>
  typeof val === "string" && val.trim() === "" ? null : val;

// Notices
export const createNoticeSchema = z.object({
  branchId: z.preprocess(emptyToNull, z.string().uuid().optional().nullable()),
  batchId: z.preprocess(emptyToNull, z.string().uuid().optional().nullable()),
  title: z.string().min(2, "Notice title is required"),
  content: z.string().min(5, "Notice content is required"),
  isPublic: z.boolean().default(true),
  pinned: z.boolean().default(false),
  priority: z.enum(["NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  attachmentUrl: z.preprocess(emptyToNull, z.string().optional().nullable()),
  expiresAt: z.preprocess(emptyToNull, z.string().optional().nullable()),
});

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;

export const updateNoticeSchema = createNoticeSchema.partial();
export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>;

// Exams
export const createExamSchema = z.object({
  batchId: z.string().uuid("Batch ID is required"),
  title: z.string().min(2, "Exam title is required"),
  subject: z.string().optional().nullable(),
  examType: z.enum(["MOCK_TEST", "WEEKLY_QUIZ", "MONTHLY_TEST", "TERM_FINAL", "PRACTICE"]).default("MOCK_TEST"),
  totalMarks: z.number().positive("Total marks must be greater than 0"),
  passMarks: z.number().positive("Pass marks must be greater than 0"),
  examDate: z.string().min(1, "Exam date is required"),
  instructions: z.string().optional().nullable(),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;

export const updateExamSchema = createExamSchema.partial();
export type UpdateExamInput = z.infer<typeof updateExamSchema>;

// Student Marks Submission
export const submitExamMarksSchema = z.object({
  scores: z.array(
    z.object({
      studentId: z.string().uuid(),
      marksObtained: z.number().min(0),
      remarks: z.string().optional().nullable(),
    })
  ).min(1, "At least one student mark is required"),
});

export type SubmitExamMarksInput = z.infer<typeof submitExamMarksSchema>;

// Referral Payouts
export const requestReferralPayoutSchema = z.object({
  studentId: z.string().uuid("Student ID is required"),
  amount: z.number().positive("Payout amount must be positive"),
  method: z.nativeEnum(PaymentMethod).default(PaymentMethod.BKASH),
  accountNumber: z.string().min(5, "Account/mobile number is required"),
  notes: z.string().optional().nullable(),
});

export type RequestReferralPayoutInput = z.infer<typeof requestReferralPayoutSchema>;

export const settleReferralPayoutSchema = z.object({
  status: z.enum(["APPROVED", "PAID", "REJECTED"]),
  transactionId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type SettleReferralPayoutInput = z.infer<typeof settleReferralPayoutSchema>;

// Attendance Tracking
export const recordAttendanceSchema = z.object({
  date: z.string().min(1, "Attendance date is required"),
  records: z.array(
    z.object({
      studentId: z.string().uuid("Student ID must be a valid UUID"),
      status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]).default("PRESENT"),
      remarks: z.string().optional().nullable(),
    })
  ).min(1, "At least one attendance record is required"),
});

export type RecordAttendanceInput = z.infer<typeof recordAttendanceSchema>;
