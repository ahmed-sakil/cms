import { z } from "zod";
import { BatchStatus, EnrollmentStatus, PaymentMethod, ClassCategory, BatchFeeType } from "@prisma/client";

export const createAcademicClassSchema = z.object({
  name: z.string().min(2, "Class name is required"),
  code: z.string().min(2, "Class code is required"),
  academicYear: z.string().min(4, "Academic year is required (e.g. 2026)"),
  category: z.nativeEnum(ClassCategory).default(ClassCategory.COLLEGE),
  displayOrder: z.number().int().optional().default(0),
});

export type CreateAcademicClassInput = z.infer<typeof createAcademicClassSchema>;

export const createCourseSchema = z.object({
  name: z.string().min(2, "Course name is required"),
  code: z.string().min(2, "Course code is required"),
  description: z.string().optional(),
  durationWeeks: z.number().int().positive("Duration must be a positive integer"),
  feeAmount: z.number().nonnegative("Fee amount must be zero or positive"),
  branchId: z.string().uuid("Please select a valid branch").optional(),
  coverImage: z.string().optional(),
  isPublic: z.boolean().default(true),
  isPublished: z.boolean().default(true),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const createBatchSchema = z.object({
  name: z.string().min(2, "Batch name is required"),
  title: z.string().optional(),
  courseId: z.string().uuid().optional().nullable(),
  academicClassId: z.string().uuid("Please select an academic class").optional().nullable(),
  branchId: z.string().uuid("Please select a branch").optional(),
  teacherId: z.string().uuid("Invalid teacher ID").optional().nullable(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
  seatLimit: z.number().int().positive().default(40),
  maxCapacity: z.number().int().positive().default(40),
  totalClasses: z.number().int().default(36),
  totalExams: z.number().int().default(12),
  classesPerWeek: z.number().int().default(3),
  daysOfWeek: z.array(z.string()).default([]),
  classTime: z.string().optional(),
  scheduleTime: z.string().optional(),
  classroom: z.string().optional(),
  feeAmount: z.number().nonnegative().default(6000),
  feeType: z.nativeEnum(BatchFeeType).default(BatchFeeType.ONE_TIME),
  coverImage: z.string().optional(),
  subjects: z.array(z.string()).optional().default([]),
  subjectTeachers: z.array(z.any()).optional().default([]),
  classModules: z.array(z.any()).optional().default([]),
  routine: z.array(z.any()).optional().default([]),
  isPublic: z.boolean().default(true),
  status: z.nativeEnum(BatchStatus).default(BatchStatus.UPCOMING),
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>;

export const updateBatchSchema = z.object({
  name: z.string().min(2).optional(),
  title: z.string().optional().nullable(),
  courseId: z.string().uuid().optional().nullable(),
  academicClassId: z.string().uuid().optional().nullable(),
  branchId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional().nullable(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  seatLimit: z.number().int().positive().optional(),
  maxCapacity: z.number().int().positive().optional(),
  totalClasses: z.number().int().optional(),
  totalExams: z.number().int().optional(),
  classesPerWeek: z.number().int().optional(),
  daysOfWeek: z.array(z.string()).optional(),
  classTime: z.string().optional().nullable(),
  scheduleTime: z.string().optional().nullable(),
  classroom: z.string().optional().nullable(),
  feeAmount: z.number().nonnegative().optional(),
  feeType: z.nativeEnum(BatchFeeType).optional(),
  coverImage: z.string().optional().nullable(),
  subjects: z.array(z.string()).optional(),
  subjectTeachers: z.array(z.any()).optional(),
  classModules: z.array(z.any()).optional(),
  routine: z.array(z.any()).optional(),
  isPublic: z.boolean().optional(),
  status: z.nativeEnum(BatchStatus).optional(),
});

export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;

export const enrollStudentSchema = z.object({
  rollNumber: z.string().optional(),
  studentId: z.string().optional(),
  status: z.nativeEnum(EnrollmentStatus).default(EnrollmentStatus.ACTIVE),
});

export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;

export const selfEnrollBatchSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod),
  transactionId: z.string().min(3, "Valid transaction ID or receipt reference is required"),
  senderPhone: z.string().min(6, "Sender phone number is required"),
  paidAmount: z.number().positive("Paid amount must be greater than zero"),
  studentNotes: z.string().optional(),
});

export type SelfEnrollBatchInput = z.infer<typeof selfEnrollBatchSchema>;

export const verifyEnrollmentSchema = z.object({
  action: z.enum(["APPROVE", "REJECT_REFUND"]),
  adminNotes: z.string().optional(),
});

export type VerifyEnrollmentInput = z.infer<typeof verifyEnrollmentSchema>;

export const createStudyMaterialSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  fileUrl: z.string().min(1, "File URL or attachment is required"),
  fileType: z.string().optional(),
  fileSize: z.number().optional(),
  courseId: z.string().uuid().optional().nullable(),
  batchId: z.string().uuid().optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
  isPublic: z.boolean().default(false),
});

export type CreateStudyMaterialInput = z.infer<typeof createStudyMaterialSchema>;
