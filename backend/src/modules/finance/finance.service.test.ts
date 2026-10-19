import { describe, it, expect, vi, beforeEach } from "vitest";
import { FinanceService } from "./finance.service.js";
import { prisma } from "../../config/prisma.js";
import { NotFoundError, ForbiddenError } from "../../common/errors/appError.js";
import { ExpenseStatus, InvoiceStatus, UserRole } from "../../types/index.js";

vi.mock("../../config/prisma.js", () => ({
  prisma: {
    expenseRecord: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    studentInvoice: {
      findUnique: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
      count: vi.fn(),
    },
    paymentTransaction: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    studentProfile: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("FinanceService Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("FinanceService.deleteExpense (IDOR & Tenant Checks)", () => {
    const mockExpense = {
      id: "exp-101",
      title: "Classroom Whiteboard Markers",
      amount: 1500,
      branchId: "branch-dhk",
      status: ExpenseStatus.PENDING,
    };

    it("throws NotFoundError when expense is not found", async () => {
      vi.mocked(prisma.expenseRecord.findUnique).mockResolvedValue(null);

      const operator = {
        userId: "usr-1",
        email: "super@cms.internal",
        role: UserRole.SUPER_ADMIN,
        branchId: null,
        institutionId: "inst-1",
      };

      await expect(
        FinanceService.deleteExpense("non-existent-exp", operator)
      ).rejects.toThrow(NotFoundError);
    });

    it("prevents Branch Admin from deleting expense from another branch", async () => {
      vi.mocked(prisma.expenseRecord.findUnique).mockResolvedValue(mockExpense as any);

      const branchAdminOther = {
        userId: "usr-2",
        email: "ctg@cms.internal",
        role: UserRole.BRANCH_ADMIN,
        branchId: "branch-ctg", // Different branch
        institutionId: "inst-1",
      };

      await expect(
        FinanceService.deleteExpense("exp-101", branchAdminOther)
      ).rejects.toThrow("You do not have permission to delete expenses from other branches");
    });

    it("prevents Branch Admin from deleting an APPROVED expense even in their campus", async () => {
      vi.mocked(prisma.expenseRecord.findUnique).mockResolvedValue({
        ...mockExpense,
        status: ExpenseStatus.APPROVED,
      } as any);

      const branchAdminSame = {
        userId: "usr-3",
        email: "dhk@cms.internal",
        role: UserRole.BRANCH_ADMIN,
        branchId: "branch-dhk",
        institutionId: "inst-1",
      };

      await expect(
        FinanceService.deleteExpense("exp-101", branchAdminSame)
      ).rejects.toThrow("Approved expenses are locked and cannot be deleted");
    });

    it("allows Branch Admin to delete a PENDING expense in their assigned branch", async () => {
      vi.mocked(prisma.expenseRecord.findUnique).mockResolvedValue(mockExpense as any);
      vi.mocked(prisma.expenseRecord.delete).mockResolvedValue(mockExpense as any);

      const branchAdminSame = {
        userId: "usr-3",
        email: "dhk@cms.internal",
        role: UserRole.BRANCH_ADMIN,
        branchId: "branch-dhk",
        institutionId: "inst-1",
      };

      const result = await FinanceService.deleteExpense("exp-101", branchAdminSame);
      expect(result).toBeDefined();
      expect(prisma.expenseRecord.delete).toHaveBeenCalledWith({
        where: { id: "exp-101" },
      });
    });

    it("allows Super Admin to delete an expense from any branch", async () => {
      vi.mocked(prisma.expenseRecord.findUnique).mockResolvedValue({
        ...mockExpense,
        status: ExpenseStatus.APPROVED,
      } as any);
      vi.mocked(prisma.expenseRecord.delete).mockResolvedValue(mockExpense as any);

      const superAdmin = {
        userId: "usr-super",
        email: "super@cms.internal",
        role: UserRole.SUPER_ADMIN,
        branchId: null,
        institutionId: "inst-1",
      };

      const result = await FinanceService.deleteExpense("exp-101", superAdmin);
      expect(result).toBeDefined();
      expect(prisma.expenseRecord.delete).toHaveBeenCalledWith({
        where: { id: "exp-101" },
      });
    });
  });

  describe("FinanceService.collectPayment", () => {
    const mockStudent = {
      id: "std-1",
      userId: "usr-std-1",
      user: { fullName: "Jane Doe", email: "jane@test.com" },
    };

    const mockInvoice = {
      id: "inv-200",
      totalAmount: 10000,
      paidAmount: 2000,
      dueAmount: 8000,
      status: InvoiceStatus.PARTIALLY_PAID,
    };

    it("correctly calculates remaining due and marks status PARTIALLY_PAID on partial payment", async () => {
      vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue(mockStudent as any);

      let invoiceUpdateArgs: any = null;
      let paymentCreateArgs: any = null;

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          studentInvoice: {
            findUnique: vi.fn().mockResolvedValue(mockInvoice),
            update: vi.fn().mockImplementation((args) => {
              invoiceUpdateArgs = args;
              return { ...mockInvoice, ...args.data };
            }),
          },
          paymentTransaction: {
            create: vi.fn().mockImplementation((args) => {
              paymentCreateArgs = args;
              return { id: "pay-1", ...args.data };
            }),
          },
        };
        return callback(tx);
      });

      const result = await FinanceService.collectPayment(
        {
          studentId: "std-1",
          invoiceId: "inv-200",
          amount: 3000, // 2000 + 3000 = 5000 paid, 5000 due
          method: "BKASH" as any,
          transactionId: "TRX-BKASH-888",
        },
        "admin-usr"
      );

      expect(result).toBeDefined();
      expect(invoiceUpdateArgs.data.paidAmount).toBe(5000);
      expect(invoiceUpdateArgs.data.dueAmount).toBe(5000);
      expect(invoiceUpdateArgs.data.status).toBe(InvoiceStatus.PARTIALLY_PAID);
      expect(paymentCreateArgs.data.receiptNumber).toMatch(/^RCPT-2026-/);
    });

    it("marks status PAID when payment completes the entire due amount", async () => {
      vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue(mockStudent as any);

      let invoiceUpdateArgs: any = null;

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          studentInvoice: {
            findUnique: vi.fn().mockResolvedValue(mockInvoice),
            update: vi.fn().mockImplementation((args) => {
              invoiceUpdateArgs = args;
              return { ...mockInvoice, ...args.data };
            }),
          },
          paymentTransaction: {
            create: vi.fn().mockResolvedValue({ id: "pay-2" }),
          },
        };
        return callback(tx);
      });

      await FinanceService.collectPayment(
        {
          studentId: "std-1",
          invoiceId: "inv-200",
          amount: 8000, // Completes the full 8000 due!
          method: "CASH" as any,
        },
        "admin-usr"
      );

      expect(invoiceUpdateArgs.data.paidAmount).toBe(10000);
      expect(invoiceUpdateArgs.data.dueAmount).toBe(0);
      expect(invoiceUpdateArgs.data.status).toBe(InvoiceStatus.PAID);
    });
  });

  describe("FinanceService.getOverview (SQL Aggregation)", () => {
    it("computes financial metrics via aggregate and groupBy queries", async () => {
      vi.mocked(prisma.studentInvoice.aggregate).mockResolvedValue({
        _sum: {
          subtotal: 500000,
          discountAmount: 20000,
          paidAmount: 380000,
          dueAmount: 100000,
        },
      } as any);

      vi.mocked(prisma.studentInvoice.count).mockResolvedValue(45);

      vi.mocked(prisma.expenseRecord.groupBy)
        .mockResolvedValueOnce([
          { status: "APPROVED", _sum: { amount: 80000 }, _count: { id: 10 } },
          { status: "PENDING", _sum: { amount: 15000 }, _count: { id: 2 } },
        ] as any)
        .mockResolvedValueOnce([
          { category: "RENT", _sum: { amount: 50000 }, _count: { id: 1 } },
          { category: "UTILITIES", _sum: { amount: 30000 }, _count: { id: 4 } },
        ] as any);

      vi.mocked(prisma.paymentTransaction.findMany).mockResolvedValue([]);
      vi.mocked(prisma.expenseRecord.findMany).mockResolvedValue([]);

      const overview = await FinanceService.getOverview();

      expect(overview).toBeDefined();
      expect(overview.totalBilled).toBe(500000);
      expect(overview.totalCollected).toBe(380000);
      expect(overview.totalOutstanding).toBe(100000);
      expect(overview.totalExpenses).toBe(80000);
      expect(overview.totalPendingExpenses).toBe(15000);
      // netOperatingBalance = totalCollected (380000) - totalExpenses (80000) = 300000
      expect(overview.netOperatingBalance).toBe(300000);
    });
  });
});
