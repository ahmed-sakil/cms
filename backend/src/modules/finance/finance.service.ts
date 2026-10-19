import { prisma } from "../../config/prisma.js";
import {
  CreateFeeStructureInput,
  CreateFeeDiscountInput,
  CreateStudentInvoiceInput,
  GenerateBatchInvoicesInput,
  CollectPaymentInput,
  CreateExpenseInput,
} from "./finance.schema.js";
import { InvoiceStatus, DiscountType, ExpenseStatus, UserRole, type JwtUserPayload } from "../../types/index.js";
import { NotFoundError, BadRequestError, ForbiddenError } from "../../common/errors/appError.js";
import { generateInvoiceNumber, generateReceiptNumber } from "../../common/utils/identifierGenerator.js";



export class FinanceService {
  // ========================================================
  // 1. FEE STRUCTURES
  // ========================================================
  static async listFeeStructures(branchId?: string) {
    return prisma.feeStructure.findMany({
      where: {
        ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}),
        isActive: true,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        course: { select: { id: true, name: true, code: true } },
        batch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createFeeStructure(input: CreateFeeStructureInput) {
    return prisma.feeStructure.create({
      data: {
        name: input.name,
        description: input.description,
        amount: input.amount,
        frequency: input.frequency,
        dueDateDay: input.dueDateDay,
        branchId: input.branchId || null,
        courseId: input.courseId || null,
        batchId: input.batchId || null,
      },
      include: {
        branch: { select: { id: true, name: true } },
        course: { select: { id: true, name: true } },
        batch: { select: { id: true, name: true } },
      },
    });
  }

  static async deleteFeeStructure(id: string) {
    const existing = await prisma.feeStructure.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Fee structure not found");
    return prisma.feeStructure.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ========================================================
  // 2. DISCOUNTS & WAIVERS
  // ========================================================
  static async listDiscounts(params?: { batchId?: string; studentId?: string }) {
    return prisma.feeDiscount.findMany({
      where: {
        isActive: true,
        ...(params?.batchId ? { OR: [{ batchId: params.batchId }, { batchId: null }] } : {}),
        ...(params?.studentId ? { OR: [{ studentId: params.studentId }, { studentId: null }] } : {}),
      },
      include: {
        batch: { select: { id: true, name: true } },
        student: {
          select: {
            id: true,
            rollNumber: true,
            user: { select: { fullName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createDiscount(input: CreateFeeDiscountInput) {
    return prisma.feeDiscount.create({
      data: {
        name: input.name,
        code: input.code || null,
        type: input.type,
        value: input.value,
        batchId: input.batchId || null,
        studentId: input.studentId || null,
        reason: input.reason || null,
      },
      include: {
        batch: { select: { id: true, name: true } },
        student: {
          select: {
            id: true,
            rollNumber: true,
            user: { select: { fullName: true } },
          },
        },
      },
    });
  }

  static async deleteDiscount(id: string) {
    const existing = await prisma.feeDiscount.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Discount rule not found");
    return prisma.feeDiscount.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ========================================================
  // 3. STUDENT INVOICES
  // ========================================================
  static async listInvoices(params?: {
    branchId?: string;
    batchId?: string;
    studentId?: string;
    status?: string;
  }) {
    return prisma.studentInvoice.findMany({
      where: {
        ...(params?.branchId ? { branchId: params.branchId } : {}),
        ...(params?.batchId ? { batchId: params.batchId } : {}),
        ...(params?.studentId ? { studentId: params.studentId } : {}),
        ...(params?.status && params.status !== "ALL"
          ? { status: params.status as InvoiceStatus }
          : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            guardianName: true,
            guardianPhone: true,
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
        batch: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        payments: {
          orderBy: { paidAt: "desc" },
          select: {
            id: true,
            receiptNumber: true,
            amount: true,
            method: true,
            transactionId: true,
            paidAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getInvoice(id: string) {
    const invoice = await prisma.studentInvoice.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            guardianName: true,
            guardianPhone: true,
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
        batch: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        payments: {
          include: {
            collectedBy: { select: { fullName: true } },
          },
          orderBy: { paidAt: "desc" },
        },
      },
    });

    if (!invoice) throw new NotFoundError("Invoice not found");
    return invoice;
  }

  static async createStudentInvoice(input: CreateStudentInvoiceInput) {
    const student = await prisma.studentProfile.findUnique({
      where: { id: input.studentId },
      include: { user: true },
    });
    if (!student) throw new NotFoundError("Student record not found");

    const invoiceNumber = generateInvoiceNumber();

    const totalAmount = Math.max(0, input.subtotal - input.discountAmount);

    const dueAmount = totalAmount;

    return prisma.studentInvoice.create({
      data: {
        invoiceNumber,
        studentId: input.studentId,
        batchId: input.batchId || null,
        branchId: input.branchId || student.user.branchId || null,
        title: input.title,
        subtotal: input.subtotal,
        discountAmount: input.discountAmount,
        discountReason: input.discountReason || null,
        totalAmount,
        paidAmount: 0,
        dueAmount,
        status: totalAmount === 0 ? InvoiceStatus.PAID : InvoiceStatus.UNPAID,
        dueDate: new Date(input.dueDate),
        notes: input.notes || null,
      },
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            user: { select: { fullName: true } },
          },
        },
        batch: { select: { id: true, name: true } },
      },
    });
  }

  static async generateBatchInvoices(input: GenerateBatchInvoicesInput) {
    const batch = await prisma.batch.findUnique({
      where: { id: input.batchId },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: { student: { include: { user: true } } },
        },
      },
    });

    if (!batch) throw new NotFoundError("Batch not found");
    if (batch.enrollments.length === 0) {
      throw new BadRequestError("Batch has no active enrolled students to generate invoices for.");
    }

    // Check discounts applicable for this batch
    const batchDiscounts = await prisma.feeDiscount.findMany({
      where: {
        isActive: true,
        OR: [{ batchId: input.batchId }, { batchId: null }],
      },
    });

    const createdInvoices = [];

    for (const enrollment of batch.enrollments) {
      const studentId = enrollment.studentId;

      // Find student or batch specific discount
      const studentDiscount = batchDiscounts.find(
        (d: any) => d.studentId === studentId || d.batchId === input.batchId
      );

      let discountAmount = 0;
      let discountReason = null;

      if (studentDiscount) {
        if (studentDiscount.type === DiscountType.PERCENTAGE) {
          discountAmount = (input.amount * Number(studentDiscount.value)) / 100;
        } else {
          discountAmount = Number(studentDiscount.value);
        }
        discountReason = `${studentDiscount.name} (${studentDiscount.type === DiscountType.PERCENTAGE ? `${studentDiscount.value}%` : `৳${studentDiscount.value}`})`;
      }

      const invoiceNumber = generateInvoiceNumber();
      const totalAmount = Math.max(0, input.amount - discountAmount);


      const inv = await prisma.studentInvoice.create({
        data: {
          invoiceNumber,
          studentId,
          batchId: input.batchId,
          branchId: batch.branchId,
          title: input.title,
          subtotal: input.amount,
          discountAmount,
          discountReason,
          totalAmount,
          paidAmount: 0,
          dueAmount: totalAmount,
          status: totalAmount === 0 ? InvoiceStatus.PAID : InvoiceStatus.UNPAID,
          dueDate: new Date(input.dueDate),
          notes: input.notes || null,
        },
      });

      createdInvoices.push(inv);
    }

    return {
      batchName: batch.name,
      totalGenerated: createdInvoices.length,
      invoices: createdInvoices,
    };
  }

  // ========================================================
  // 4. PAYMENT COLLECTION & RECEIPT GENERATION
  // ========================================================
  static async collectPayment(input: CollectPaymentInput, collectedById?: string) {
    const student = await prisma.studentProfile.findUnique({
      where: { id: input.studentId },
      include: { user: true },
    });
    if (!student) throw new NotFoundError("Student not found");

    const receiptNumber = generateReceiptNumber();

    // Perform transaction to update invoice if linked

    const payment = await prisma.$transaction(async (tx: any) => {
      let linkedInvoice = null;

      if (input.invoiceId) {
        linkedInvoice = await tx.studentInvoice.findUnique({
          where: { id: input.invoiceId },
        });
        if (!linkedInvoice) throw new NotFoundError("Invoice not found");

        const newPaidAmount = Number(linkedInvoice.paidAmount) + input.amount;
        const newDueAmount = Math.max(0, Number(linkedInvoice.totalAmount) - newPaidAmount);

        let newStatus: InvoiceStatus = InvoiceStatus.PARTIALLY_PAID;
        if (newDueAmount === 0) {
          newStatus = InvoiceStatus.PAID;
        }

        await tx.studentInvoice.update({
          where: { id: input.invoiceId },
          data: {
            paidAmount: newPaidAmount,
            dueAmount: newDueAmount,
            status: newStatus,
          },
        });
      }

      return tx.paymentTransaction.create({
        data: {
          receiptNumber,
          studentId: input.studentId,
          invoiceId: input.invoiceId || null,
          amount: input.amount,
          method: input.method,
          transactionId: input.transactionId || null,
          accountNumber: input.accountNumber || null,
          collectedById: collectedById || null,
          notes: input.notes || null,
          paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
        },
        include: {
          student: {
            select: {
              id: true,
              rollNumber: true,
              guardianName: true,
              guardianPhone: true,
              bloodGroup: true,
              user: { select: { fullName: true, email: true, phone: true } },
            },
          },
          invoice: {
            include: {
              batch: { select: { name: true } },
              branch: { select: { name: true, address: true, phone: true } },
            },
          },
          collectedBy: { select: { fullName: true } },
        },
      });
    });

    return payment;
  }

  static async getPaymentByReceipt(receiptNumber: string) {
    const payment = await prisma.paymentTransaction.findUnique({
      where: { receiptNumber },
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            guardianName: true,
            guardianPhone: true,
            bloodGroup: true,
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
        invoice: {
          include: {
            batch: { select: { name: true } },
            branch: { select: { name: true, address: true, phone: true } },
          },
        },
        collectedBy: { select: { fullName: true } },
      },
    });

    if (!payment) throw new NotFoundError("Receipt record not found");
    return payment;
  }

  // ========================================================
  // 5. TOTAL COSTING & OPERATIONAL EXPENSES
  // ========================================================
  static async listExpenses(params?: {
    branchId?: string;
    category?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    return prisma.expenseRecord.findMany({
      where: {
        ...(params?.branchId && params.branchId !== "ALL" ? { branchId: params.branchId } : {}),
        ...(params?.category && params.category !== "ALL"
          ? { category: params.category as any }
          : {}),
        ...(params?.status && params.status !== "ALL"
          ? { status: params.status as any }
          : {}),
        ...(params?.startDate || params?.endDate
          ? {
              expenseDate: {
                ...(params?.startDate ? { gte: new Date(params.startDate) } : {}),
                ...(params?.endDate ? { lte: new Date(params.endDate) } : {}),
              },
            }
          : {}),
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        recordedBy: { select: { id: true, fullName: true, role: true } },
        approvedBy: { select: { id: true, fullName: true, role: true } },
      },
      orderBy: { expenseDate: "desc" },
    });
  }

  static async createExpense(
    input: CreateExpenseInput,
    operator: { userId: string; role: string; branchId?: string | null }
  ) {
    let branchId = input.branchId || null;
    let status: any = "PENDING";
    let approvedById: string | null = null;
    let approvedAt: Date | null = null;

    if (operator.role === "BRANCH_ADMIN") {
      branchId = operator.branchId || null;
      status = "PENDING";
    } else if (operator.role === "SUPER_ADMIN") {
      status = "APPROVED";
      approvedById = operator.userId;
      approvedAt = new Date();
    }

    return prisma.expenseRecord.create({
      data: {
        branchId,
        recordedById: operator.userId,
        category: input.category,
        title: input.title,
        amount: input.amount,
        expenseDate: new Date(input.expenseDate),
        paymentMethod: input.paymentMethod,
        paidTo: input.paidTo,
        receiptUrl: input.receiptUrl || null,
        notes: input.notes || null,
        status,
        approvedById,
        approvedAt,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        recordedBy: { select: { id: true, fullName: true, role: true } },
        approvedBy: { select: { id: true, fullName: true, role: true } },
      },
    });
  }

  static async updateExpenseStatus(
    id: string,
    status: "APPROVED" | "REJECTED",
    rejectionReason: string | null | undefined,
    superAdminId: string
  ) {
    const existing = await prisma.expenseRecord.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Expense record not found");

    return prisma.expenseRecord.update({
      where: { id },
      data: {
        status: status as any,
        approvedById: status === "APPROVED" ? superAdminId : null,
        approvedAt: status === "APPROVED" ? new Date() : null,
        rejectionReason: status === "REJECTED" ? (rejectionReason || null) : null,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        recordedBy: { select: { id: true, fullName: true, role: true } },
        approvedBy: { select: { id: true, fullName: true, role: true } },
      },
    });
  }

  static async deleteExpense(id: string, operator: JwtUserPayload) {
    const existing = await prisma.expenseRecord.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Expense record not found");

    if (operator.role === UserRole.BRANCH_ADMIN) {
      if (existing.branchId !== operator.branchId) {
        throw new ForbiddenError("You do not have permission to delete expenses from other branches.");
      }
      if (existing.status === ExpenseStatus.APPROVED) {
        throw new ForbiddenError("Approved expenses are locked and cannot be deleted by branch administrators.");
      }
    } else if (operator.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError("You do not have permission to delete expense records.");
    }

    return prisma.expenseRecord.delete({ where: { id } });
  }


  // ========================================================
  // 6. FINANCIAL ANALYTICS & OVERVIEW
  // ========================================================
  static async getOverview(branchId?: string) {
    const branchFilter = branchId ? { branchId } : {};

    // 1. Invoices Aggregation
    const invoices = await prisma.studentInvoice.findMany({
      where: branchFilter,
      select: {
        subtotal: true,
        discountAmount: true,
        totalAmount: true,
        paidAmount: true,
        dueAmount: true,
        status: true,
      },
    });

    let totalBilled = 0;
    let totalDiscount = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;

    for (const inv of invoices) {
      totalBilled += Number(inv.subtotal);
      totalDiscount += Number(inv.discountAmount);
      totalCollected += Number(inv.paidAmount);
      totalOutstanding += Number(inv.dueAmount);
    }

    // 2. Expenses Aggregation
    const expenses = await prisma.expenseRecord.findMany({
      where: branchFilter,
      select: { amount: true, category: true, status: true },
    });

    let totalExpenses = 0;
    let totalPendingExpenses = 0;
    let pendingExpenseCount = 0;
    const expenseByCategory: Record<string, number> = {};

    for (const exp of expenses) {
      const amt = Number(exp.amount);
      if (exp.status === "APPROVED") {
        totalExpenses += amt;
        expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + amt;
      } else if (exp.status === "PENDING") {
        totalPendingExpenses += amt;
        pendingExpenseCount += 1;
      }
    }

    // 3. Net Cash Flow & Balance
    const netOperatingBalance = totalCollected - totalExpenses;

    // 4. Recent Transactions
    const recentPayments = await prisma.paymentTransaction.findMany({
      where: branchId ? { invoice: { branchId } } : {},
      take: 5,
      orderBy: { paidAt: "desc" },
      include: {
        student: { select: { rollNumber: true, user: { select: { fullName: true } } } },
      },
    });

    // 5. Recent Expenses
    const recentExpenses = await prisma.expenseRecord.findMany({
      where: branchFilter,
      take: 5,
      orderBy: { expenseDate: "desc" },
      include: {
        branch: { select: { name: true } },
        recordedBy: { select: { fullName: true } },
      },
    });

    return {
      totalBilled,
      totalDiscount,
      totalCollected,
      totalOutstanding,
      totalExpenses,
      totalPendingExpenses,
      pendingExpenseCount,
      netOperatingBalance,
      expenseByCategory,
      recentPayments,
      recentExpenses,
    };
  }

  // ========================================================
  // 7. STUDENT SELF-SERVICE
  // ========================================================
  static async getStudentInvoices(userId: string) {
    const student = await prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!student) throw new NotFoundError("Student record not found");

    return prisma.studentInvoice.findMany({
      where: { studentId: student.id },
      include: {
        batch: { select: { name: true } },
        payments: {
          orderBy: { paidAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getStudentPayments(userId: string) {
    const student = await prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!student) throw new NotFoundError("Student record not found");

    return prisma.paymentTransaction.findMany({
      where: { studentId: student.id },
      include: {
        invoice: {
          include: {
            batch: { select: { name: true } },
          },
        },
      },
      orderBy: { paidAt: "desc" },
    });
  }
}
