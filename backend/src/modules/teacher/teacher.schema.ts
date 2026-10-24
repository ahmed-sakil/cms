import { z } from "zod";
import { Gender, ExamType, AttendanceStatus } from "@prisma/client";

export const teacherRegisterSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Phone number must be at least 8 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type TeacherRegisterInput = z.infer<typeof teacherRegisterSchema>;

export const qualificationItemSchema = z.object({
  degree: z.string().min(1, "Degree/Exam name is required"),
  passingYear: z.string().min(4, "Year is required"),
  board: z.string().optional().default(""),
  institute: z.string().min(1, "Institution name is required"),
  result: z.string().min(1, "Result/GPA is required"),
});

export const teacherApplicationSchema = z.object({
  gender: z.nativeEnum(Gender).default(Gender.MALE),
  dateOfBirth: z.string().nullable().optional(),
  fatherName: z.string().nullable().optional(),
  motherName: z.string().nullable().optional(),
  religion: z.string().nullable().optional(),
  presentAddress: z.string().nullable().optional(),
  permanentAddress: z.string().nullable().optional(),
  educationalQualifications: z.array(qualificationItemSchema).default([]),
  preferredClass: z.string().nullable().optional(),
  preferredSubject: z.string().nullable().optional(),
  preferredBranchId: z.string().uuid().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
});

export type TeacherApplicationInput = z.infer<typeof teacherApplicationSchema>;

export const recordTeacherAttendanceSchema = z.object({
  date: z.string().min(1, "Date is required (YYYY-MM-DD)"),
  records: z.array(
    z.object({
      studentId: z.string().uuid("Invalid student ID"),
      status: z.nativeEnum(AttendanceStatus),
      remarks: z.string().nullable().optional(),
    })
  ).min(1, "At least one attendance record is required"),
});

export type RecordTeacherAttendanceInput = z.infer<typeof recordTeacherAttendanceSchema>;

export const createTeacherExamSchema = z.object({
  batchId: z.string().uuid("Invalid batch ID"),
  title: z.string().min(2, "Exam title is required"),
  subject: z.string().nullable().optional(),
  examType: z.nativeEnum(ExamType).default(ExamType.MOCK_TEST),
  totalMarks: z.number().positive("Total marks must be greater than 0"),
  passMarks: z.number().positive("Pass marks must be greater than 0"),
  examDate: z.string().min(1, "Exam date is required"),
  instructions: z.string().nullable().optional(),
});

export type CreateTeacherExamInput = z.infer<typeof createTeacherExamSchema>;

export const submitTeacherExamMarksSchema = z.object({
  scores: z.array(
    z.object({
      studentId: z.string().uuid("Invalid student ID"),
      marksObtained: z.number().min(0, "Marks must be non-negative"),
    })
  ).min(1, "At least one student score is required"),
  publishImmediately: z.boolean().optional().default(false),
});

export type SubmitTeacherExamMarksInput = z.infer<typeof submitTeacherExamMarksSchema>;

export const createTeacherMaterialSchema = z.object({
  batchId: z.string().uuid("Batch ID is required"),
  title: z.string().min(2, "Title is required"),
  description: z.string().nullable().optional(),
  classTopic: z.string().nullable().optional(),
  examId: z.string().uuid().nullable().optional(),
  fileUrl: z.string().min(1, "File URL is required"),
  fileType: z.string().nullable().optional(),
  fileSize: z.number().int().positive().nullable().optional(),
});

export type CreateTeacherMaterialInput = z.infer<typeof createTeacherMaterialSchema>;

export const createTeacherNoticeSchema = z.object({
  batchId: z.string().uuid().nullable().optional(),
  courseId: z.string().uuid().nullable().optional(),
  title: z.string().min(2, "Notice title is required"),
  content: z.string().min(5, "Notice content is required"),
  priority: z.string().optional().default("NORMAL"),
  attachmentUrl: z.string().nullable().optional(),
});

export type CreateTeacherNoticeInput = z.infer<typeof createTeacherNoticeSchema>;

export const createTeacherTipSchema = z.object({
  category: z.string().min(2, "Category is required"),
  title: z.string().min(3, "Title is required"),
  excerpt: z.string().min(5, "Excerpt is required"),
  content: z.string().min(10, "Article content is required"),
  coverImage: z.string().nullable().optional(),
});

export type CreateTeacherTipInput = z.infer<typeof createTeacherTipSchema>;

export const updateTeacherRoutineSchema = z.object({
  routine: z.array(
    z.object({
      day: z.string(),
      startTime: z.string().optional().default(""),
      endTime: z.string().optional().default(""),
      subject: z.string().optional().default(""),
      teacherName: z.string().optional().default(""),
      teacherId: z.string().optional(),
      classroom: z.string().optional().default(""),
      topic: z.string().optional().default(""),
    })
  ).default([]),
  classModules: z.array(z.any()).optional().default([]),
});

export type UpdateTeacherRoutineInput = z.infer<typeof updateTeacherRoutineSchema>;
