import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma.js";
import { NotFoundError, BadRequestError } from "../../common/errors/appError.js";
import type { UpdateStudentProfileInput } from "../../schemas/index.js";

export class StudentService {
  static async getStudentDashboard(userId: string) {
    const student = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { fullName: true, email: true, phone: true, avatarUrl: true, branchId: true, branch: { select: { name: true, code: true } } } },
        enrollments: {
          include: {
            batch: {
              include: {
                course: { select: { name: true, code: true } },
                teacher: { include: { user: { select: { fullName: true } } } },
              },
            },
          },
        },
        attendances: {
          take: 10,
          orderBy: { date: "desc" },
          include: {
            batch: { select: { name: true } },
          },
        },
        examResults: {
          where: {
            exam: { isPublished: true },
          },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            exam: { select: { title: true, totalMarks: true } },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundError("Student profile not found for this user");
    }

    const batchIds = student.enrollments.map((e) => e.batchId);
    const branchId = student.user.branchId;

    const notices = await prisma.publicNotice.findMany({
      where: {
        OR: [
          { isPublic: true },
          ...(branchId ? [{ branchId }] : []),
          ...(batchIds.length > 0 ? [{ batchId: { in: batchIds } }] : []),
        ],
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        ],
      },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
      take: 5,
    });

    return { ...student, notices };
  }

  static async getStudentNotices(userId: string) {
    const student = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { branchId: true } },
        enrollments: { select: { batchId: true, batch: { select: { courseId: true } } } },
      },
    });

    if (!student) {
      throw new NotFoundError("Student profile not found for this user");
    }

    const batchIds = student.enrollments.map((e) => e.batchId);
    const courseIds = student.enrollments.map((e) => e.batch.courseId).filter(Boolean) as string[];
    const branchId = student.user.branchId;

    return prisma.publicNotice.findMany({
      where: {
        OR: [
          { isPublic: true },
          ...(branchId ? [{ branchId }] : []),
          ...(batchIds.length > 0 ? [{ batchId: { in: batchIds } }] : []),
          ...(courseIds.length > 0 ? [{ courseId: { in: courseIds } }] : []),
        ],
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        ],
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        batch: { select: { id: true, name: true } },
        course: { select: { id: true, name: true } },
        author: { select: { fullName: true } },
      },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    });
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verify current password (which could be the default email address or previously set)
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestError("Current password is incorrect");
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        refreshToken: null, // revoke old sessions
      },
    });

    return { message: "Password updated successfully. Please use your new password going forward." };
  }

  static async updateProfile(userId: string, input: UpdateStudentProfileInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true },
    });

    if (!user || !user.studentProfile) {
      throw new NotFoundError("Student profile not found");
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      if (input.fullName || input.phone) {
        await tx.user.update({
          where: { id: userId },
          data: {
            fullName: input.fullName,
            phone: input.phone,
          },
        });
      }

      const updatedProfile = await tx.studentProfile.update({
        where: { id: user.studentProfile!.id },
        data: {
          guardianName: input.guardianName ?? undefined,
          guardianPhone: input.guardianPhone ?? undefined,
          guardianType: input.guardianType ?? undefined,
          fatherName: input.fatherName !== undefined ? input.fatherName : undefined,
          motherName: input.motherName !== undefined ? input.motherName : undefined,
          bloodGroup: input.bloodGroup !== undefined ? input.bloodGroup : undefined,
          address: input.address !== undefined ? input.address : undefined,
          currentClass: input.currentClass !== undefined ? input.currentClass : undefined,
          institutionName: input.institutionName !== undefined ? input.institutionName : undefined,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        },
      });

      return { ...user, studentProfile: updatedProfile };
    });

    return updatedUser;
  }

  static async getStudentAttendance(userId: string) {
    const student = await prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      throw new NotFoundError("Student profile not found for this user");
    }

    return prisma.attendance.findMany({
      where: { studentId: student.id },
      orderBy: { date: "desc" },
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            classroom: true,
            course: { select: { name: true } },
          },
        },
      },
    });
  }
}

