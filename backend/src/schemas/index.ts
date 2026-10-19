import { z } from "zod";
import { Gender, UserRole } from "../types/index.js";

// Strong Password Regex: at least 8 chars, 1 letter, 1 number
const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&-_]{8,}$/;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerUserSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.nativeEnum(UserRole),
  branchId: z.string().uuid("Invalid branch ID").optional().nullable(),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;

// Admin Student Admission (Password is optional; defaults to student's email)
export const createStudentSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  password: z.string().min(6).optional(),
  branchId: z.string().uuid("Branch is required"),
  rollNumber: z.string().min(1, "Roll number is required").optional(),
  dateOfBirth: z.string().optional(),
  gender: z.nativeEnum(Gender).default(Gender.MALE),
  guardianName: z.string().min(2, "Guardian name is required"),
  guardianPhone: z.string().min(10, "Guardian phone is required"),
  address: z.string().optional(),
  batchId: z.string().uuid("Invalid batch ID").optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

// Student Self-Registration (Requires strong password)
export const studentSelfRegisterSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      strongPasswordRegex,
      "Password must contain at least 8 characters, including at least one letter and one number"
    ),
  branchId: z.string().uuid("Please select a branch"),
  gender: z.nativeEnum(Gender).default(Gender.MALE),
  guardianName: z.string().min(2, "Guardian name is required"),
  guardianPhone: z.string().min(10, "Guardian phone number is required"),
  guardianType: z.string().default("FATHER").optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  currentClass: z.string().optional(),
  institutionName: z.string().optional(),
  referredByCode: z.string().optional(),
});

export type StudentSelfRegisterInput = z.infer<typeof studentSelfRegisterSchema>;

// Password Change Schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(
        strongPasswordRegex,
        "Password must contain at least 8 characters, including at least one letter and one number"
      ),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New password and confirmation do not match",
    path: ["confirmNewPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const updateStudentProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional(),
  fatherName: z.string().optional().nullable(),
  motherName: z.string().optional().nullable(),
  guardianType: z.string().optional().nullable(),
  guardianName: z.string().min(2, "Guardian name is required").optional().nullable(),
  guardianPhone: z.string().min(10, "Guardian phone is required").optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  currentClass: z.string().optional().nullable(),
  institutionName: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
});

export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;

export const createCourseSchema = z.object({
  name: z.string().min(3, "Course name must be at least 3 characters"),
  code: z.string().min(2, "Course code is required"),
  description: z.string().optional(),
  durationWeeks: z.number().int().positive("Duration must be a positive integer"),
  feeAmount: z.number().nonnegative("Fee amount must be zero or greater"),
  isPublic: z.boolean().default(true),
  isPublished: z.boolean().default(true),
  coverImage: z.string().url("Invalid cover image URL").optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const admissionInquirySchema = z.object({
  studentName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number is required"),
  interestedCourseId: z.string().uuid().optional(),
  preferredBranchId: z.string().uuid().optional(),
  message: z.string().max(500, "Message must be under 500 characters").optional(),
});

export type AdmissionInquiryInput = z.infer<typeof admissionInquirySchema>;

// Payment Channel Item Schema
export const paymentChannelSchema = z.object({
  id: z.string().optional(),
  provider: z.enum(["BKASH", "NAGAD", "ROCKET", "UPAY", "BANK"]),
  accountType: z.enum(["PERSONAL", "MERCHANT", "AGENT"]),
  accountNumber: z.string().min(5, "Account number is required"),
  instructions: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type PaymentChannelInput = z.infer<typeof paymentChannelSchema>;

// Poster Slide Schema for Hero Slider
export const posterSlideSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, "Slide title is required"),
  subtitle: z.string().optional(),
  imageUrl: z.string().min(1, "Image URL is required"),
  actionText: z.string().optional(),
  actionUrl: z.string().optional(),
  order: z.number().int().default(1),
  isActive: z.boolean().default(true),
});

export type PosterSlideInput = z.infer<typeof posterSlideSchema>;

// Organization Settings Schema
export const updateOrganizationSchema = z.object({
  name: z.string().min(2, "Organization name is required").optional(),
  tagline: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  establishedYear: z.string().optional().or(z.literal("")),
  whatsappNumber: z.string().optional().or(z.literal("")),
  logoUrl: z.string().optional().or(z.literal("")),
  faviconUrl: z.string().optional().or(z.literal("")),
  paymentChannels: z.array(paymentChannelSchema).optional(),
  posters: z.array(posterSlideSchema).optional(),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

// Branch Schemas
export const createBranchSchema = z.object({
  name: z.string().min(2, "Branch name is required"),
  code: z.string().min(2, "Branch code is required"),
  address: z.string().min(3, "Address is required"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  whatsappNumber: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  establishedYear: z.string().optional().or(z.literal("")),
  directorId: z.string().uuid().optional().nullable().or(z.literal("")),
  managerId: z.string().uuid().optional().nullable().or(z.literal("")),
  isMainBranch: z.boolean().optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;

// Teacher & Staff Schemas
export const createTeacherSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  password: z.string().min(6).optional(),
  branchId: z.string().uuid("Please select a primary branch"),
  qualification: z.string().optional(),
  specialization: z.string().min(2, "Specialization / Subject is required"),
  bio: z.string().optional(),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;

export const updateTeacherSchema = z.object({
  fullName: z.string().min(2, "Full name is required").optional(),
  phone: z.string().min(10, "Phone number is required").optional(),
  branchId: z.string().uuid("Please select a valid branch").optional(),
  qualification: z.string().optional(),
  specialization: z.string().min(2, "Specialization is required").optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;

export const createStaffSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  password: z.string().min(6).optional(),
  branchId: z.string().uuid("Please select a branch"),
  designation: z.string().min(2, "Designation is required"),
  department: z.string().optional(),
  role: z.enum(["STAFF", "BRANCH_ADMIN"]).optional().default("STAFF"),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const updateStaffSchema = z.object({
  fullName: z.string().min(2, "Full name is required").optional(),
  phone: z.string().min(10, "Phone number is required").optional(),
  branchId: z.string().uuid("Please select a branch").optional(),
  designation: z.string().min(2, "Designation is required").optional(),
  department: z.string().optional(),
  role: z.enum(["STAFF", "BRANCH_ADMIN"]).optional(),
  avatarUrl: z.string().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

