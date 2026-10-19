import { prisma } from "../../config/prisma.js";
import {
  CreateNoticeInput,
  UpdateNoticeInput,
  CreateExamInput,
  UpdateExamInput,
  SubmitExamMarksInput,
  RequestReferralPayoutInput,
  SettleReferralPayoutInput,
} from "./academic-ops.schema.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../common/errors/appError.js";
import { UserRole, type JwtUserPayload } from "../../types/index.js";


export class AcademicOpsService {
  // ========================================================
  // 1. NOTICES MANAGEMENT
  // ========================================================
  static async listNotices(params?: {
    branchId?: string;
    batchId?: string;
    isPublic?: boolean;
  }) {
    return prisma.publicNotice.findMany({
      where: {
        ...(params?.branchId ? { OR: [{ branchId: params.branchId }, { branchId: null }] } : {}),
        ...(params?.batchId ? { OR: [{ batchId: params.batchId }, { batchId: null }] } : {}),
        ...(typeof params?.isPublic === "boolean" ? { isPublic: params.isPublic } : {}),
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        batch: { select: { id: true, name: true } },
      },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    });
  }

  static async getPublicNotices(limit = 10) {
    return prisma.publicNotice.findMany({
      where: { isPublic: true },
      take: limit,
      include: {
        branch: { select: { name: true } },
      },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    });
  }

  static async createNotice(
    input: CreateNoticeInput,
    operator?: { role?: string; branchId?: string | null }
  ) {
    let branchId = input.branchId || null;
    if (operator?.role === "BRANCH_ADMIN") {
      branchId = operator.branchId || null;
    }

    let parsedExpiresAt: Date | null = null;
    if (input.expiresAt) {
      const d = new Date(input.expiresAt);
      if (!isNaN(d.getTime())) {
        parsedExpiresAt = d;
      }
    }

    return prisma.publicNotice.create({
      data: {
        title: input.title,
        content: input.content,
        branchId,
        batchId: input.batchId || null,
        isPublic: input.isPublic,
        pinned: input.pinned,
        priority: input.priority,
        attachmentUrl: input.attachmentUrl || null,
        expiresAt: parsedExpiresAt,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        batch: { select: { id: true, name: true } },
      },
    });
  }

  static async updateNotice(id: string, input: UpdateNoticeInput) {
    const existing = await prisma.publicNotice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Notice not found");

    return prisma.publicNotice.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.content !== undefined ? { content: input.content } : {}),
        ...(input.branchId !== undefined ? { branchId: input.branchId || null } : {}),
        ...(input.batchId !== undefined ? { batchId: input.batchId || null } : {}),
        ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
        ...(input.pinned !== undefined ? { pinned: input.pinned } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.attachmentUrl !== undefined ? { attachmentUrl: input.attachmentUrl || null } : {}),
        ...(input.expiresAt !== undefined
          ? { expiresAt: input.expiresAt ? new Date(input.expiresAt) : null }
          : {}),
      },
    });
  }

  static async deleteNotice(id: string, operator: JwtUserPayload) {
    const existing = await prisma.publicNotice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Notice not found");

    if (operator.role === UserRole.BRANCH_ADMIN) {
      if (!existing.branchId) {
        throw new ForbiddenError("Only super administrators can delete global notices.");
      }
      if (existing.branchId !== operator.branchId) {
        throw new ForbiddenError("You do not have permission to delete notices for other branches.");
      }
    } else if (operator.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError("You do not have permission to delete notices.");
    }

    return prisma.publicNotice.delete({ where: { id } });
  }


  static async togglePin(id: string) {
    const existing = await prisma.publicNotice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Notice not found");
    return prisma.publicNotice.update({
      where: { id },
      data: { pinned: !existing.pinned },
    });
  }

  // ========================================================
  // 2. EXAMS & RESULTS GRADING
  // ========================================================
  static async listExams(params?: { batchId?: string; branchId?: string }) {
    return prisma.exam.findMany({
      where: {
        ...(params?.batchId ? { batchId: params.batchId } : {}),
        ...(params?.branchId ? { batch: { branchId: params.branchId } } : {}),
      },
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            course: { select: { name: true } },
            branch: { select: { name: true } },
            _count: { select: { enrollments: true } },
          },
        },
        _count: { select: { results: true } },
      },
      orderBy: { examDate: "desc" },
    });
  }

  static async getExam(id: string) {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        batch: {
          include: {
            course: true,
            branch: true,
            enrollments: {
              where: { status: "ACTIVE" },
              include: {
                student: {
                  include: {
                    user: { select: { fullName: true, email: true, phone: true } },
                  },
                },
              },
            },
          },
        },
        results: {
          include: {
            student: {
              include: {
                user: { select: { fullName: true, email: true } },
              },
            },
          },
          orderBy: { rank: "asc" },
        },
      },
    });

    if (!exam) throw new NotFoundError("Exam not found");
    return exam;
  }

  static async createExam(input: CreateExamInput) {
    const batch = await prisma.batch.findUnique({ where: { id: input.batchId } });
    if (!batch) throw new NotFoundError("Batch not found");

    return prisma.exam.create({
      data: {
        batchId: input.batchId,
        title: input.title,
        subject: input.subject || null,
        examType: input.examType,
        totalMarks: input.totalMarks,
        passMarks: input.passMarks,
        examDate: new Date(input.examDate),
        instructions: input.instructions || null,
      },
      include: {
        batch: { select: { name: true } },
      },
    });
  }

  static async updateExam(id: string, input: UpdateExamInput) {
    const existing = await prisma.exam.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Exam not found");

    return prisma.exam.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.subject !== undefined ? { subject: input.subject || null } : {}),
        ...(input.examType ? { examType: input.examType } : {}),
        ...(input.totalMarks ? { totalMarks: input.totalMarks } : {}),
        ...(input.passMarks ? { passMarks: input.passMarks } : {}),
        ...(input.examDate ? { examDate: new Date(input.examDate) } : {}),
        ...(input.instructions !== undefined ? { instructions: input.instructions || null } : {}),
      },
    });
  }

  static async deleteExam(id: string) {
    const existing = await prisma.exam.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Exam not found");
    return prisma.exam.delete({ where: { id } });
  }

  static calculateGrade(marks: number, total: number): string {
    const percentage = (marks / total) * 100;
    if (percentage >= 80) return "A+";
    if (percentage >= 70) return "A";
    if (percentage >= 60) return "A-";
    if (percentage >= 50) return "B";
    if (percentage >= 40) return "C";
    if (percentage >= 33) return "D";
    return "F";
  }

  static async submitExamMarks(examId: string, input: SubmitExamMarksInput) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundError("Exam not found");

    const totalMarksNum = Number(exam.totalMarks);
    const passMarksNum = Number(exam.passMarks);

    // Sort scores descending to calculate ranks
    const sortedScores = [...input.scores].sort(
      (a, b) => b.marksObtained - a.marksObtained
    );

    const results = [];
    let currentRank = 1;

    for (let i = 0; i < sortedScores.length; i++) {
      const item = sortedScores[i];
      if (i > 0 && item.marksObtained < sortedScores[i - 1].marksObtained) {
        currentRank = i + 1;
      }

      const grade = this.calculateGrade(item.marksObtained, totalMarksNum);
      const isPassed = item.marksObtained >= passMarksNum;

      const res = await prisma.examResult.upsert({
        where: {
          examId_studentId: {
            examId,
            studentId: item.studentId,
          },
        },
        create: {
          examId,
          studentId: item.studentId,
          marksObtained: item.marksObtained,
          grade,
          rank: currentRank,
          isPassed,
          remarks: item.remarks || null,
        },
        update: {
          marksObtained: item.marksObtained,
          grade,
          rank: currentRank,
          isPassed,
          remarks: item.remarks || null,
        },
        include: {
          student: {
            select: {
              rollNumber: true,
              user: { select: { fullName: true } },
            },
          },
        },
      });

      results.push(res);
    }

    return results;
  }

  // ========================================================
  // 3. STUDENT EXAM SCORECARDS
  // ========================================================
  static async getStudentExamHistory(userId: string) {
    const student = await prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!student) throw new NotFoundError("Student record not found");

    return prisma.examResult.findMany({
      where: { studentId: student.id },
      include: {
        exam: {
          include: {
            batch: { select: { name: true } },
          },
        },
      },
      orderBy: { exam: { examDate: "desc" } },
    });
  }

  // ========================================================
  // 4. STUDENT REFERRALS & MANUAL PAYOUTS
  // ========================================================
  static async getStudentReferralProfile(userId: string) {
    let student = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        referrals: {
          include: {
            user: { select: { fullName: true, createdAt: true } },
            enrollments: { select: { batch: { select: { name: true } } } },
          },
        },
        referralPayouts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!student) throw new NotFoundError("Student profile not found");

    // Auto-generate unique referral code if missing
    if (!student.referralCode) {
      const base = (student.rollNumber || student.id.slice(0, 8)).replace(/[^a-zA-Z0-9]/g, "");
      const code = `REF-${base}`;
      try {
        student = await prisma.studentProfile.update({
          where: { id: student.id },
          data: { referralCode: code },
          include: {
            user: { select: { fullName: true, email: true, phone: true } },
            referrals: {
              include: {
                user: { select: { fullName: true, createdAt: true } },
                enrollments: { select: { batch: { select: { name: true } } } },
              },
            },
            referralPayouts: {
              orderBy: { createdAt: "desc" },
            },
          },
        });
      } catch {
        const uniqueCode = `${code}-${Math.floor(100 + Math.random() * 900)}`;
        student = await prisma.studentProfile.update({
          where: { id: student.id },
          data: { referralCode: uniqueCode },
          include: {
            user: { select: { fullName: true, email: true, phone: true } },
            referrals: {
              include: {
                user: { select: { fullName: true, createdAt: true } },
                enrollments: { select: { batch: { select: { name: true } } } },
              },
            },
            referralPayouts: {
              orderBy: { createdAt: "desc" },
            },
          },
        });
      }
    }

    // Calculations: ৳500 per successful referral
    const bonusPerReferral = 500;
    const totalReferrals = student.referrals?.length || 0;
    const totalEarned = totalReferrals * bonusPerReferral;

    const totalPaid = (student.referralPayouts || [])
      .filter((p) => p.status === "PAID")
      .reduce((acc, p) => acc + Number(p.amount), 0);

    const pendingPayout = (student.referralPayouts || [])
      .filter((p) => p.status === "PENDING" || p.status === "APPROVED")
      .reduce((acc, p) => acc + Number(p.amount), 0);

    const availableBalance = Math.max(0, totalEarned - totalPaid - pendingPayout);

    return {
      studentId: student.id,
      fullName: student.user?.fullName || "Student",
      rollNumber: student.rollNumber,
      referralCode: student.referralCode || `REF-${student.rollNumber}`,
      totalReferrals,
      totalEarned,
      totalPaid,
      pendingPayout,
      availableBalance,
      referralsList: (student.referrals || []).map((r) => ({
        fullName: r.user?.fullName || "Enrolled Student",
        rollNumber: r.rollNumber,
        joinedAt: r.createdAt,
      })),
      payoutsList: student.referralPayouts || [],
    };
  }

  static async requestReferralPayout(userId: string, input: RequestReferralPayoutInput) {
    return prisma.$transaction(
      async (tx) => {
        const student = await tx.studentProfile.findUnique({
          where: { userId },
          include: {
            referrals: true,
            referralPayouts: true,
          },
        });
        if (!student) throw new NotFoundError("Student not found");

        const totalEarned = student.referrals.length * 500;
        const existingWithdrawn = student.referralPayouts
          .filter((p) => p.status !== "REJECTED")
          .reduce((acc, p) => acc + Number(p.amount), 0);

        const available = totalEarned - existingWithdrawn;
        if (input.amount > available) {
          throw new BadRequestError(
            `Insufficient referral earnings. Available balance is ৳${available}`
          );
        }

        return tx.referralPayout.create({
          data: {
            studentId: student.id,
            amount: input.amount,
            method: input.method,
            accountNumber: input.accountNumber,
            notes: input.notes || null,
            status: "PENDING",
          },
        });
      },
      {
        isolationLevel: "Serializable",
      }
    );
  }


  static async listReferralPayouts(status?: string) {
    return prisma.referralPayout.findMany({
      where: status && status !== "ALL" ? { status } : {},
      include: {
        student: {
          select: {
            rollNumber: true,
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async settleReferralPayout(
    payoutId: string,
    input: SettleReferralPayoutInput,
    processedById?: string
  ) {
    const existing = await prisma.referralPayout.findUnique({
      where: { id: payoutId },
    });
    if (!existing) throw new NotFoundError("Payout request not found");

    return prisma.referralPayout.update({
      where: { id: payoutId },
      data: {
        status: input.status,
        transactionId: input.transactionId || null,
        notes: input.notes || null,
        paidAt: input.status === "PAID" ? new Date() : null,
        processedById: processedById || null,
      },
      include: {
        student: {
          select: {
            rollNumber: true,
            user: { select: { fullName: true } },
          },
        },
      },
    });
  }
}
