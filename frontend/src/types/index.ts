export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  BRANCH_ADMIN = "BRANCH_ADMIN",
  TEACHER = "TEACHER",
  STAFF = "STAFF",
  STUDENT = "STUDENT",
  PARENT = "PARENT",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export enum EnrollmentStatus {
  APPLIED = "APPLIED",
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  DROPPED = "DROPPED",
}

export enum BatchStatus {
  UPCOMING = "UPCOMING",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
  EXCUSED = "EXCUSED",
}

export enum FeeStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  OVERDUE = "OVERDUE",
  WAIVED = "WAIVED",
}

export enum PaymentMethod {
  CASH = "CASH",
  BKASH = "BKASH",
  NAGAD = "NAGAD",
  ROCKET = "ROCKET",
  BANK_TRANSFER = "BANK_TRANSFER",
  OTHER = "OTHER",
}

export enum InvoiceStatus {
  UNPAID = "UNPAID",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  WAIVED = "WAIVED",
  CANCELLED = "CANCELLED",
}

export enum FeeFrequency {
  ONE_TIME = "ONE_TIME",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  PER_EXAM = "PER_EXAM",
}

export enum DiscountType {
  PERCENTAGE = "PERCENTAGE",
  FLAT_AMOUNT = "FLAT_AMOUNT",
}

export enum ExpenseCategory {
  RENT = "RENT",
  UTILITIES = "UTILITIES",
  TEACHER_HONORARIUM = "TEACHER_HONORARIUM",
  STAFF_SALARY = "STAFF_SALARY",
  PRINTING_STATIONERY = "PRINTING_STATIONERY",
  EQUIPMENT_MAINTENANCE = "EQUIPMENT_MAINTENANCE",
  MARKETING = "MARKETING",
  OTHER = "OTHER",
}

export enum ExpenseStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]> | string | null;
}

export interface AuthSessionResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    branchId: string | null;
    avatarUrl?: string | null;
  };
  accessToken: string;
  refreshToken?: string;
}

export interface StudentRecord {

  id: string;
  fullName: string;
  email: string;
  phone: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  } | null;
  rollNumber?: string;
  guardianName?: string;
  guardianPhone?: string;
  enrollments?: Array<{
    id: string;
    batch: {
      id: string;
      name: string;
      course?: { name: string };
    };
  }>;
  createdAt: string;
}

export interface PaymentChannel {
  id: string;
  provider: "BKASH" | "NAGAD" | "ROCKET" | "UPAY" | "BANK";
  accountType: "PERSONAL" | "MERCHANT" | "AGENT";
  accountNumber: string;
  instructions?: string;
  isActive: boolean;
}

export interface PosterSlide {
  id?: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  actionText?: string;
  actionUrl?: string;
  order: number;
  isActive: boolean;
}

export interface OrganizationSettings {
  id?: string;
  name: string;
  tagline?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  faviconUrl?: string;
  establishedYear?: string;
  whatsappNumber?: string;
  paymentChannels: PaymentChannel[];
  posters?: PosterSlide[];
}

export interface BranchLeadershipUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface BranchRecord {
  id: string;
  name: string;
  code: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  whatsappNumber?: string | null;
  description?: string | null;
  establishedYear?: string | null;
  directorId?: string | null;
  managerId?: string | null;
  director?: BranchLeadershipUser | null;
  manager?: BranchLeadershipUser | null;
  isMainBranch?: boolean;
  isActive: boolean;
  createdAt: string;
  _count?: {
    users?: number;
    students?: number;
    teachers?: number;
    staff?: number;
    batches?: number;
    courses?: number;
  };
}

export interface TeacherRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role?: string;
  avatarUrl?: string | null;
  branch?: { id: string; name: string; code: string } | null;
  qualification?: string;
  specialization?: string;
  bio?: string;
  batches?: Array<{ id: string; name: string; course?: { name: string } }>;
  isActive: boolean;
  createdAt: string;
}

export interface StaffRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role?: string;
  branch?: { id: string; name: string; code: string } | null;
  designation?: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
}

export enum ClassCategory {
  SCHOOL = "SCHOOL",
  COLLEGE = "COLLEGE",
  ADMISSION = "ADMISSION",
  PROFESSIONAL = "PROFESSIONAL",
}

export enum BatchFeeType {
  ONE_TIME = "ONE_TIME",
  INSTALLMENT = "INSTALLMENT",
  MONTHLY = "MONTHLY",
}

export interface AcademicClassRecord {
  id: string;
  name: string;
  code: string;
  academicYear: string;
  category: ClassCategory;
  displayOrder: number;
  batchesCount?: number;
}

export interface PendingEnrollmentRecord {
  id: string;
  batchId: string;
  batchName: string;
  batchTitle: string;
  branchName: string;
  academicClass: string;
  seatLimit: number;
  confirmedSeats: number;
  seatsAvailable: number;
  isSeatAvailable: boolean;
  studentId: string;
  rollNumber: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  senderPhone?: string;
  paidAmount: number;
  studentNotes?: string;
  appliedAt: string;
}

