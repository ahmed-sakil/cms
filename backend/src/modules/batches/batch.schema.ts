import { z } from "zod";
import { BatchStatus, EnrollmentStatus, PaymentMethod, ClassCategory, BatchFeeType, ExamType } from "@prisma/client";

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

const emptyToNull = (val: unknown) =>
  typeof val === "string" && val.trim() === "" ? null : val;

export const createBatchSchema = z.object({
  name: z.string().min(2, "Batch name is required"),
  title: z.preprocess(emptyToNull, z.string().nullable().optional()),
  courseId: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  academicClassId: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  branchId: z.preprocess(emptyToNull, z.string().uuid("Please select a valid branch").nullable().optional()),
  teacherId: z.preprocess(emptyToNull, z.string().uuid("Invalid teacher ID").nullable().optional()),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.preprocess(emptyToNull, z.string().nullable().optional()),
  seatLimit: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== "" ? Number(val) : 40),
    z.number().int().positive().default(40)
  ),
  maxCapacity: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== "" ? Number(val) : 40),
    z.number().int().positive().default(40)
  ),
  totalClasses: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== "" ? Number(val) : 36),
    z.number().int().default(36)
  ),
  totalExams: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== "" ? Number(val) : 12),
    z.number().int().default(12)
  ),
  classesPerWeek: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== "" ? Number(val) : 3),
    z.number().int().default(3)
  ),
  daysOfWeek: z.array(z.string()).default([]),
  classTime: z.preprocess(emptyToNull, z.string().nullable().optional()),
  scheduleTime: z.preprocess(emptyToNull, z.string().nullable().optional()),
  classroom: z.preprocess(emptyToNull, z.string().nullable().optional()),
  feeAmount: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== "" ? Number(val) : 6000),
    z.number().nonnegative().default(6000)
  ),
  feeType: z.nativeEnum(BatchFeeType).default(BatchFeeType.ONE_TIME),
  coverImage: z.preprocess(emptyToNull, z.string().nullable().optional()),
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
  title: z.preprocess(emptyToNull, z.string().nullable().optional()),
  courseId: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  academicClassId: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  branchId: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  teacherId: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  startDate: z.string().optional(),
  endDate: z.preprocess(emptyToNull, z.string().nullable().optional()),
  seatLimit: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== "" ? Number(val) : undefined),
    z.number().int().positive().optional()
  ),
  maxCapacity: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== "" ? Number(val) : undefined),
    z.number().int().positive().optional()
  ),
  totalClasses: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== "" ? Number(val) : undefined),
    z.number().int().optional()
  ),
  totalExams: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== "" ? Number(val) : undefined),
    z.number().int().optional()
  ),
  classesPerWeek: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== "" ? Number(val) : undefined),
    z.number().int().optional()
  ),
  daysOfWeek: z.array(z.string()).optional(),
  classTime: z.preprocess(emptyToNull, z.string().nullable().optional()),
  scheduleTime: z.preprocess(emptyToNull, z.string().nullable().optional()),
  classroom: z.preprocess(emptyToNull, z.string().nullable().optional()),
  feeAmount: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== "" ? Number(val) : undefined),
    z.number().nonnegative().optional()
  ),
  feeType: z.nativeEnum(BatchFeeType).optional(),
  coverImage: z.preprocess(emptyToNull, z.string().nullable().optional()),
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

export const scheduledExamItemSchema = z.object({
  id: z.string().uuid().optional(),
  examNumber: z.number().int().optional(),
  title: z.string().min(1, "Exam title is required"),
  subject: z.string().nullable().optional(),
  examType: z.nativeEnum(ExamType).default(ExamType.MOCK_TEST),
  examDate: z.string().min(1, "Exam date is required"),
  totalMarks: z.preprocess(
    (v) => (v !== undefined && v !== null && v !== "" ? Number(v) : 100),
    z.number().positive().default(100)
  ),
  passMarks: z.preprocess(
    (v) => (v !== undefined && v !== null && v !== "" ? Number(v) : 40),
    z.number().nonnegative().default(40)
  ),
  instructions: z.string().nullable().optional(),
});

export const batchCurriculumSchema = z.object({
  subjects: z.array(z.string()).default([]),
  subjectTeachers: z.array(
    z.object({
      subject: z.string(),
      teacherId: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
      teacherName: z.string().optional(),
    })
  ).default([]),
  daysOfWeek: z.array(z.string()).optional(),
  classTime: z.preprocess(emptyToNull, z.string().nullable().optional()),
  classroom: z.preprocess(emptyToNull, z.string().nullable().optional()),
  classModules: z.array(
    z.object({
      classNumber: z.number().int().optional(),
      weekOrClass: z.string().optional(),
      title: z.string().min(1, "Class lecture title is required"),
      subject: z.string().nullable().optional(),
      date: z.string().nullable().optional(),
      time: z.string().nullable().optional(),
      teacherId: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
      teacherName: z.string().optional(),
      room: z.string().nullable().optional(),
      topics: z.array(z.string()).optional().default([]),
    })
  ).default([]),
  routine: z.array(
    z.object({
      day: z.string(),
      time: z.string(),
      subject: z.string(),
      room: z.string().optional(),
      teacherName: z.string().optional(),
    })
  ).default([]),
  exams: z.array(scheduledExamItemSchema).default([]),
});

export type BatchCurriculumInput = z.infer<typeof batchCurriculumSchema>;
export type ScheduledExamItemInput = z.infer<typeof scheduledExamItemSchema>;
