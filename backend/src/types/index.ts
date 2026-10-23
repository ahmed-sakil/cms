export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  BRANCH_ADMIN = "BRANCH_ADMIN",
  TEACHER = "TEACHER",
  STAFF = "STAFF",
  STUDENT = "STUDENT",
  PARENT = "PARENT",
  APPLICANT = "APPLICANT",
}

export enum ApplicationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
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

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum PayoutStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  PAID = "PAID",
  REJECTED = "REJECTED",
}

export enum InquiryStatus {
  NEW = "NEW",
  CONTACTED = "CONTACTED",
  ADMITTED = "ADMITTED",
  REJECTED = "REJECTED",
}

export enum ExamType {
  MOCK_TEST = "MOCK_TEST",
  WEEKLY_QUIZ = "WEEKLY_QUIZ",
  MONTHLY_TEST = "MONTHLY_TEST",
  TERM_FINAL = "TERM_FINAL",
  PRACTICE = "PRACTICE",
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]> | string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface JwtUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  branchId: string | null;
  institutionId: string;
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

