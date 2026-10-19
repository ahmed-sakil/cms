import { z } from "zod";
import {
  FeeFrequency,
  PaymentMethod,
  InvoiceStatus,
  DiscountType,
  ExpenseCategory,
} from "../../types/index.js";

// Fee Structure
export const createFeeStructureSchema = z.object({
  branchId: z.string().uuid().optional().nullable(),
  courseId: z.string().uuid().optional().nullable(),
  batchId: z.string().uuid().optional().nullable(),
  name: z.string().min(2, "Fee structure name is required"),
  description: z.string().optional().nullable(),
  amount: z.number().positive("Amount must be greater than 0"),
  frequency: z.nativeEnum(FeeFrequency).default(FeeFrequency.MONTHLY),
  dueDateDay: z.number().int().min(1).max(31).default(10),
});

export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>;

// Fee Discount / Waiver
export const createFeeDiscountSchema = z.object({
  name: z.string().min(2, "Discount name is required"),
  code: z.string().optional().nullable(),
  type: z.nativeEnum(DiscountType).default(DiscountType.PERCENTAGE),
  value: z.number().positive("Discount value must be greater than 0"),
  batchId: z.string().uuid().optional().nullable(),
  studentId: z.string().uuid().optional().nullable(),
  reason: z.string().optional().nullable(),
});

export type CreateFeeDiscountInput = z.infer<typeof createFeeDiscountSchema>;

// Student Invoice
export const createStudentInvoiceSchema = z.object({
  studentId: z.string().uuid("Student ID is required"),
  batchId: z.string().uuid().optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
  title: z.string().min(2, "Invoice title is required"),
  subtotal: z.number().positive("Subtotal must be positive"),
  discountAmount: z.number().min(0).default(0),
  discountReason: z.string().optional().nullable(),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional().nullable(),
});

export type CreateStudentInvoiceInput = z.infer<typeof createStudentInvoiceSchema>;

// Batch-wide Invoice Generation
export const generateBatchInvoicesSchema = z.object({
  batchId: z.string().uuid("Batch ID is required"),
  feeStructureId: z.string().uuid().optional().nullable(),
  title: z.string().min(2, "Invoice title is required"),
  amount: z.number().positive("Amount must be positive"),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional().nullable(),
});

export type GenerateBatchInvoicesInput = z.infer<typeof generateBatchInvoicesSchema>;

// Payment Collection
export const collectPaymentSchema = z.object({
  invoiceId: z.string().uuid().optional().nullable(),
  studentId: z.string().uuid("Student ID is required"),
  amount: z.number().positive("Payment amount must be greater than 0"),
  method: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  transactionId: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  paidAt: z.string().optional(),
});

export type CollectPaymentInput = z.infer<typeof collectPaymentSchema>;

const emptyToNull = (val: unknown) =>
  typeof val === "string" && val.trim() === "" ? null : val;

// Operational Expense Record (Total Costing)
export const createExpenseSchema = z.object({
  branchId: z.preprocess(emptyToNull, z.string().uuid().optional().nullable()),
  category: z.nativeEnum(ExpenseCategory).default(ExpenseCategory.OTHER),
  title: z.string().min(2, "Expense title is required"),
  amount: z.number().positive("Expense amount must be positive"),
  expenseDate: z.string().min(1, "Expense date is required"),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  paidTo: z.string().min(2, "Payee is required"),
  receiptUrl: z.preprocess(emptyToNull, z.string().optional().nullable()),
  notes: z.preprocess(emptyToNull, z.string().optional().nullable()),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.preprocess(emptyToNull, z.string().optional().nullable()),
});

export type UpdateExpenseStatusInput = z.infer<typeof updateExpenseStatusSchema>;
