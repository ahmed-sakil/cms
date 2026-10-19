import { describe, it, expect, vi, beforeEach } from "vitest";
import { BatchService } from "./batch.service.js";
import { prisma } from "../../config/prisma.js";
import { NotFoundError, BadRequestError, ForbiddenError } from "../../common/errors/appError.js";
import { BatchStatus, EnrollmentStatus } from "@prisma/client";
import { UserRole } from "../../types/index.js";

vi.mock("../../config/prisma.js", () => ({
  prisma: {
    batch: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    batchEnrollment: {
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    studentInvoice: {
      create: vi.fn(),
    },
    paymentTransaction: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("BatchService Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("BatchService.deleteBatch", () => {
    const mockBatch = {
      id: "batch-101",
      name: "HSC 2026 Batch A",
      branchId: "branch-dhk",
      status: BatchStatus.UPCOMING,
      deletedAt: null,
      _count: { enrollments: 0 },
    };

    it("throws NotFoundError when batch does not exist", async () => {
      vi.mocked(prisma.batch.findUnique).mockResolvedValue(null);

      await expect(
        BatchService.deleteBatch("non-existent-batch")
      ).rejects.toThrow(NotFoundError);
    });

    it("prevents Branch Admin from deleting a batch from another campus (IDOR protection)", async () => {
      vi.mocked(prisma.batch.findUnique).mockResolvedValue(mockBatch as any);

      const branchAdminOtherCampus = {
        userId: "usr-admin-ctg",
        email: "ctg@cms.internal",
        role: UserRole.BRANCH_ADMIN,
        branchId: "branch-ctg",
        institutionId: "inst-1",
      };

      await expect(
        BatchService.deleteBatch("batch-101", branchAdminOtherCampus)
      ).rejects.toThrow(ForbiddenError);
    });

    it("allows Branch Admin to delete a batch from their own campus", async () => {
      vi.mocked(prisma.batch.findUnique).mockResolvedValue(mockBatch as any);
      vi.mocked(prisma.batch.delete).mockResolvedValue(mockBatch as any);

      const branchAdminSameCampus = {
        userId: "usr-admin-dhk",
        email: "dhk@cms.internal",
        role: UserRole.BRANCH_ADMIN,
        branchId: "branch-dhk",
        institutionId: "inst-1",
      };

      const result = await BatchService.deleteBatch("batch-101", branchAdminSameCampus);
      expect(result).toBeDefined();
      expect(prisma.batch.delete).toHaveBeenCalledWith({ where: { id: "batch-101" } });
    });

    it("soft-deletes batch if active enrollments exist", async () => {
      vi.mocked(prisma.batch.findUnique).mockResolvedValue({
        ...mockBatch,
        _count: { enrollments: 12 },
      } as any);
      vi.mocked(prisma.batch.update).mockResolvedValue({} as any);

      await BatchService.deleteBatch("batch-101");
      expect(prisma.batch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "batch-101" },
          data: expect.objectContaining({
            status: BatchStatus.CANCELLED,
          }),
        })
      );
    });
  });

  describe("BatchService.verifyEnrollment", () => {
    const mockEnrollment = {
      id: "enr-555",
      batchId: "batch-101",
      studentId: "std-999",
      status: EnrollmentStatus.PENDING_VERIFICATION,
      paidAmount: 12000,
      paymentMethod: "CASH",
      transactionId: null,
      senderPhone: null,
      adminNotes: null,
      batch: {
        id: "batch-101",
        name: "HSC 2026 Batch A",
        title: "HSC 2026 Batch A",
        branchId: "branch-dhk",
        feeAmount: 12000,
        seatLimit: 40,
        maxCapacity: 40,
      },
      student: {
        id: "std-999",
        rollNumber: "2026-DHK-0001-A1B2",
        user: { fullName: "Test Student", email: "student@test.com" },
      },
    };

    it("throws BadRequestError if the batch has reached maximum physical seat limit", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          batchEnrollment: {
            findUnique: vi.fn().mockResolvedValue(mockEnrollment),
            count: vi.fn().mockResolvedValue(40), // 40 active out of 40 seatLimit!
          },
        };
        return callback(tx);
      });

      await expect(
        BatchService.verifyEnrollment("enr-555", "APPROVE", "admin-1")
      ).rejects.toThrow("Cannot approve: Physical seat capacity (40 seats) for this batch has already been reached.");
    });

    it("throws BadRequestError if application has already been approved", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          batchEnrollment: {
            findUnique: vi.fn().mockResolvedValue({
              ...mockEnrollment,
              status: EnrollmentStatus.ACTIVE,
            }),
          },
        };
        return callback(tx);
      });

      await expect(
        BatchService.verifyEnrollment("enr-555", "APPROVE", "admin-1")
      ).rejects.toThrow("already been verified and approved");
    });

    it("atomically confirms seat, updates status to ACTIVE, and creates invoice & receipt", async () => {
      let createdInvoice: any = null;
      let createdReceipt: any = null;
      let updatedEnrollment: any = null;

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          batchEnrollment: {
            findUnique: vi.fn().mockResolvedValue(mockEnrollment),
            count: vi.fn().mockResolvedValue(15), // 15 active out of 40 limit
            update: vi.fn().mockImplementation((args) => {
              updatedEnrollment = args;
              return { ...mockEnrollment, status: EnrollmentStatus.ACTIVE };
            }),
          },
          studentInvoice: {
            create: vi.fn().mockImplementation((args) => {
              createdInvoice = args;
              return { id: "inv-1", ...args.data };
            }),
          },
          paymentTransaction: {
            create: vi.fn().mockImplementation((args) => {
              createdReceipt = args;
              return { id: "rcpt-1", ...args.data };
            }),
          },
        };
        return callback(tx);
      });

      const result = await BatchService.verifyEnrollment(
        "enr-555",
        "APPROVE",
        "admin-1",
        "Payment verified in cash."
      );

      expect(result).toBeDefined();
      expect(result.message).toContain("Admission verified");
      expect((result as any).invoice).toBeDefined();
      expect((result as any).payment).toBeDefined();
      expect(updatedEnrollment.data.status).toBe(EnrollmentStatus.ACTIVE);
      expect(createdInvoice.data.invoiceNumber).toMatch(/^INV-2026-/);
      expect(createdReceipt.data.receiptNumber).toMatch(/^RCPT-2026-/);
      expect(createdReceipt.data.amount).toBe(12000);
    });

    it("updates enrollment to CANCELLED_REFUND and marks notes for refund on REJECT_REFUND", async () => {
      vi.mocked(prisma.batchEnrollment.findUnique).mockResolvedValue(mockEnrollment as any);
      vi.mocked(prisma.batchEnrollment.update).mockResolvedValue({
        ...mockEnrollment,
        status: EnrollmentStatus.CANCELLED_REFUND,
      } as any);

      const result = await BatchService.verifyEnrollment(
        "enr-555",
        "REJECT_REFUND",
        "admin-1",
        "Classroom capacity filled."
      );

      expect(result.message).toContain("Application canceled and scheduled for fee refund");
      expect(prisma.batchEnrollment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "enr-555" },
          data: expect.objectContaining({
            status: EnrollmentStatus.CANCELLED_REFUND,
          }),
        })
      );
    });
  });
});
