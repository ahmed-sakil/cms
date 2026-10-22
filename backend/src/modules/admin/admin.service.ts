import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../common/errors/appError.js";
import { UserRole } from "../../types/index.js";
import type {
  CreateStudentInput,
  AdminUpdateStudentInput,
  UpdateOrganizationInput,
  CreateBranchInput,
  CreateTeacherInput,
  UpdateTeacherInput,
  CreateStaffInput,
  UpdateStaffInput,
} from "../../schemas/index.js";
import { generateRollNumber } from "../../common/utils/identifierGenerator.js";
import { PublicService } from "../public/public.service.js";


export class AdminService {
  static async getOverviewMetrics(branchId?: string | null) {
    const branchFilter = branchId ? { branchId } : {};

    const [totalStudents, totalBatches, totalCourses, activeBranches] = await Promise.all([
      prisma.studentProfile.count({
        where: branchId ? { user: { branchId } } : {},
      }),
      prisma.batch.count({
        where: {
          ...branchFilter,
          deletedAt: null,
        },
      }),
      prisma.course.count({
        where: {
          ...branchFilter,
          deletedAt: null,
        },
      }),
      prisma.branch.count({
        where: { isActive: true },
      }),
    ]);

    return {
      totalStudents,
      totalBatches,
      totalCourses,
      activeBranches,
    };
  }

  static async listBranches() {
    const branches = await prisma.branch.findMany({
      orderBy: [{ isMainBranch: "desc" }, { createdAt: "desc" }],
      include: {
        director: {
          select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true },
        },
        manager: {
          select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true },
        },
        _count: {
          select: { batches: true, courses: true },
        },
      },
    });

    const branchIds = branches.map((b) => b.id);
    const userRoleCounts = await prisma.user.groupBy({
      by: ["branchId", "role"],
      where: {
        branchId: { in: branchIds },
        deletedAt: null,
      },
      _count: { _all: true },
    });

    const countsMap = new Map<
      string,
      { students: number; teachers: number; staff: number; totalUsers: number }
    >();

    for (const b of branches) {
      countsMap.set(b.id, { students: 0, teachers: 0, staff: 0, totalUsers: 0 });
    }

    for (const item of userRoleCounts) {
      if (!item.branchId) continue;
      const counts = countsMap.get(item.branchId);
      if (counts) {
        counts.totalUsers += item._count._all;
        if (item.role === UserRole.STUDENT) {
          counts.students += item._count._all;
        } else if (item.role === UserRole.TEACHER) {
          counts.teachers += item._count._all;
        } else if (item.role === UserRole.STAFF) {
          counts.staff += item._count._all;
        }
      }
    }

    return branches.map((b) => {
      const counts = countsMap.get(b.id) || { students: 0, teachers: 0, staff: 0, totalUsers: 0 };
      return {
        ...b,
        _count: {
          batches: b._count.batches,
          courses: b._count.courses,
          users: counts.totalUsers,
          students: counts.students,
          teachers: counts.teachers,
          staff: counts.staff,
        },
      };
    });
  }

  static async createStudent(
    input: CreateStudentInput,
    institutionId?: string,
    operator?: { role?: string; branchId?: string | null }
  ) {
    if (operator?.role === UserRole.BRANCH_ADMIN) {
      if (operator.branchId && input.branchId !== operator.branchId) {
        throw new ForbiddenError("Branch administrators can only admit students to their assigned branch.");
      }
    }

    // 1. Verify branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: input.branchId },
    });
    if (!branch) {
      throw new NotFoundError("Branch not found");
    }

    // 2. Check for duplicate email or phone
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { phone: input.phone }],
      },
    });
    if (existingUser) {
      throw new BadRequestError(
        existingUser.email === input.email
          ? "A user with this email already exists"
          : "A user with this phone number already exists"
      );
    }

    // 3. Roll Number assignment (auto-generate if omitted)
    let rollNumber = input.rollNumber;
    if (!rollNumber) {
      const year = new Date().getFullYear();
      const count = await prisma.studentProfile.count({
        where: { user: { branchId: input.branchId } },
      });
      rollNumber = generateRollNumber(year, branch.code, count + 1);
    } else {

      const existingRoll = await prisma.studentProfile.findUnique({
        where: { rollNumber },
      });
      if (existingRoll) {
        throw new BadRequestError(`Roll number ${rollNumber} is already in use`);
      }
    }

    // 4. Password policy: If admin doesn't provide a password, use the student's email as default
    const plainPassword = input.password && input.password.trim().length > 0 ? input.password : input.email;
    const isDefaultPassword = !input.password || input.password.trim().length === 0;
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const effectiveInstitutionId =
      institutionId && institutionId.trim().length > 0 ? institutionId : branch.institutionId;

    // 5. Create user and studentProfile in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          institutionId: effectiveInstitutionId,
          branchId: input.branchId,
          email: input.email,
          phone: input.phone,
          fullName: input.fullName,
          avatarUrl: input.avatarUrl || null,
          role: UserRole.STUDENT,
          passwordHash,
          studentProfile: {
            create: {
              rollNumber,
              gender: input.gender,
              guardianName: input.guardianName,
              guardianPhone: input.guardianPhone,
              guardianType: input.guardianType || "FATHER",
              fatherName: input.fatherName || null,
              motherName: input.motherName || null,
              bloodGroup: input.bloodGroup || null,
              address: input.address || null,
              currentClass: input.currentClass || null,
              institutionName: input.institutionName || null,
              dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
            },
          },
        },
        include: {
          studentProfile: true,
          branch: { select: { id: true, name: true, code: true } },
        },
      });

      // 6. Optional: Enroll in initial batch
      if (input.batchId && user.studentProfile) {
        const batch = await tx.batch.findUnique({
          where: { id: input.batchId },
        });
        if (batch) {
          await tx.batchEnrollment.create({
            data: {
              batchId: batch.id,
              studentId: user.studentProfile.id,
            },
          });
        }
      }

      return user;
    });

    return {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      phone: newUser.phone,
      rollNumber: newUser.studentProfile?.rollNumber,
      branch: newUser.branch,
      isDefaultPassword,
      credentialsNote: isDefaultPassword
        ? `Account created. Initial password is the student's email: ${newUser.email}`
        : "Account created with custom password.",
    };
  }

  static async listStudents(params: {
    branchId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const skip = (page - 1) * limit;

    const whereClause: any = {
      role: UserRole.STUDENT,
      deletedAt: null,
    };

    if (params.branchId) {
      whereClause.branchId = params.branchId;
    }

    if (params.search) {
      whereClause.OR = [
        { fullName: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
        { phone: { contains: params.search, mode: "insensitive" } },
        {
          studentProfile: {
            rollNumber: { contains: params.search, mode: "insensitive" },
          },
        },
      ];
    }

    const [total, students] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        include: {
          branch: { select: { id: true, name: true, code: true } },
          studentProfile: {
            include: {
              enrollments: {
                include: {
                  batch: {
                    select: { id: true, name: true, course: { select: { name: true } } },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: students.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        email: s.email,
        phone: s.phone,
        avatarUrl: s.avatarUrl,
        branch: s.branch,
        rollNumber: s.studentProfile?.rollNumber,
        gender: s.studentProfile?.gender,
        currentClass: s.studentProfile?.currentClass,
        institutionName: s.studentProfile?.institutionName,
        guardianName: s.studentProfile?.guardianName,
        guardianPhone: s.studentProfile?.guardianPhone,
        enrollments: s.studentProfile?.enrollments || [],
        createdAt: s.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getStudentById(id: string) {
    const student = await prisma.user.findFirst({
      where: {
        id,
        role: UserRole.STUDENT,
        deletedAt: null,
      },
      include: {
        branch: true,
        studentProfile: {
          include: {
            enrollments: {
              include: {
                batch: {
                  include: {
                    course: true,
                  },
                },
              },
              orderBy: { enrolledAt: "desc" },
            },
            invoices: {
              include: {
                batch: { select: { id: true, name: true } },
                branch: { select: { id: true, name: true } },
                payments: {
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
            },
            payments: {
              include: {
                invoice: { select: { id: true, invoiceNumber: true, title: true } },
              },
              orderBy: { paidAt: "desc" },
            },
            attendances: {
              take: 30,
              orderBy: { date: "desc" },
            },
            examResults: {
              include: { exam: true },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundError("Student not found");
    }

    return student;
  }

  static async updateStudent(
    id: string,
    input: AdminUpdateStudentInput,
    operator?: { role?: string; branchId?: string | null }
  ) {
    const student = await prisma.user.findFirst({
      where: { id, role: UserRole.STUDENT, deletedAt: null },
      include: { studentProfile: true },
    });

    if (!student || !student.studentProfile) {
      throw new NotFoundError("Student record not found");
    }

    if (operator?.role === UserRole.BRANCH_ADMIN) {
      if (operator.branchId && student.branchId !== operator.branchId) {
        throw new ForbiddenError("Branch administrators can only manage students from their assigned branch.");
      }
      if (input.branchId && input.branchId !== operator.branchId) {
        throw new ForbiddenError("Branch administrators cannot transfer students to other branches.");
      }
    }

    // Check duplicate email or phone if changed
    if (input.email && input.email !== student.email) {
      const existing = await prisma.user.findFirst({ where: { email: input.email, id: { not: id } } });
      if (existing) throw new BadRequestError("A user with this email already exists");
    }
    if (input.phone && input.phone !== student.phone) {
      const existing = await prisma.user.findFirst({ where: { phone: input.phone, id: { not: id } } });
      if (existing) throw new BadRequestError("A user with this phone number already exists");
    }

    // Check roll number collision if changed
    if (input.rollNumber && input.rollNumber !== student.studentProfile.rollNumber) {
      const existingRoll = await prisma.studentProfile.findFirst({
        where: { rollNumber: input.rollNumber, id: { not: student.studentProfile.id } },
      });
      if (existingRoll) throw new BadRequestError(`Roll number ${input.rollNumber} is already in use`);
    }

    // Hash password if updating
    let passwordHash: string | undefined;
    if (input.password && input.password.trim().length > 0) {
      passwordHash = await bcrypt.hash(input.password, 10);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl : undefined,
          isActive: input.isActive !== undefined ? input.isActive : undefined,
          branchId: input.branchId !== undefined ? input.branchId : undefined,
          ...(passwordHash ? { passwordHash } : {}),
          studentProfile: {
            update: {
              rollNumber: input.rollNumber,
              gender: input.gender,
              guardianName: input.guardianName,
              guardianPhone: input.guardianPhone,
              guardianType: input.guardianType !== undefined ? input.guardianType : undefined,
              fatherName: input.fatherName !== undefined ? input.fatherName : undefined,
              motherName: input.motherName !== undefined ? input.motherName : undefined,
              bloodGroup: input.bloodGroup !== undefined ? input.bloodGroup : undefined,
              address: input.address !== undefined ? input.address : undefined,
              currentClass: input.currentClass !== undefined ? input.currentClass : undefined,
              institutionName: input.institutionName !== undefined ? input.institutionName : undefined,
              dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
            },
          },
        },
        include: {
          branch: true,
          studentProfile: true,
        },
      });
      return user;
    });

    return updated;
  }

  static async deleteStudent(id: string, operator?: { role?: string; branchId?: string | null }) {
    const student = await prisma.user.findFirst({
      where: { id, role: UserRole.STUDENT, deletedAt: null },
    });

    if (!student) {
      throw new NotFoundError("Student not found");
    }

    if (operator?.role === UserRole.BRANCH_ADMIN) {
      if (operator.branchId && student.branchId !== operator.branchId) {
        throw new ForbiddenError("Branch administrators can only delete students from their assigned branch.");
      }
    }

    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return { id, fullName: student.fullName };
  }

  // ==========================================
  // ORGANIZATION SETTINGS & PAYMENT CHANNELS
  // ==========================================
  static async getOrganizationSettings(institutionId?: string) {
    let institution = null;
    if (institutionId && institutionId.trim().length > 0) {
      institution = await prisma.institution.findUnique({
        where: { id: institutionId },
      });
    }

    if (!institution) {
      // Fallback: fetch the first institution or create default
      institution = await prisma.institution.findFirst();
    }

    if (!institution) {
      throw new NotFoundError("Institution not found");
    }

    return institution;
  }

  static async updateOrganizationSettings(institutionId: string | undefined, input: UpdateOrganizationInput) {
    let institution = null;
    if (institutionId && institutionId.trim().length > 0) {
      institution = await prisma.institution.findUnique({
        where: { id: institutionId },
      });
    }

    if (!institution) {
      institution = await prisma.institution.findFirst();
    }

    if (!institution) {
      throw new NotFoundError("Institution not found");
    }

    const updated = await prisma.institution.update({
      where: { id: institution.id },
      data: {
        name: input.name,
        tagline: input.tagline,
        website: input.website,
        email: input.email,
        phone: input.phone,
        address: input.address,
        establishedYear: input.establishedYear !== undefined ? input.establishedYear : undefined,
        whatsappNumber: input.whatsappNumber !== undefined ? input.whatsappNumber : undefined,
        logoUrl: input.logoUrl,
        faviconUrl: input.faviconUrl,
        paymentChannels: input.paymentChannels !== undefined ? (input.paymentChannels as any) : undefined,
        posters: input.posters !== undefined ? (input.posters as any) : undefined,
      },
    });

    PublicService.invalidateLandingCache();
    return updated;
  }

  // ==========================================
  // BRANCH MANAGEMENT
  // ==========================================
  static async createBranch(institutionId: string | undefined, input: CreateBranchInput) {
    let targetInstId = institutionId;
    if (!targetInstId || targetInstId.trim().length === 0) {
      const firstInst = await prisma.institution.findFirst({ select: { id: true } });
      if (!firstInst) throw new NotFoundError("No institution found to attach branch to");
      targetInstId = firstInst.id;
    }

    const existing = await prisma.branch.findUnique({
      where: { code: input.code },
    });
    if (existing) {
      throw new BadRequestError(`Branch code '${input.code}' is already registered`);
    }

    const directorId = input.directorId && input.directorId.trim().length > 0 ? input.directorId : null;
    const managerId = input.managerId && input.managerId.trim().length > 0 ? input.managerId : null;

    // If new branch is marked as main branch, demote previous main branch and sync institution address
    if (input.isMainBranch) {
      await prisma.branch.updateMany({
        where: { institutionId: targetInstId, isMainBranch: true },
        data: { isMainBranch: false },
      });
      await prisma.institution.update({
        where: { id: targetInstId },
        data: {
          address: input.address,
          ...(input.phone ? { phone: input.phone } : {}),
          ...(input.whatsappNumber ? { whatsappNumber: input.whatsappNumber } : {}),
        },
      });
    }

    return prisma.branch.create({
      data: {
        institutionId: targetInstId,
        name: input.name,
        code: input.code,
        address: input.address,
        phone: input.phone || null,
        email: input.email || null,
        whatsappNumber: input.whatsappNumber || null,
        description: input.description || null,
        establishedYear: input.establishedYear || null,
        directorId,
        managerId,
        isMainBranch: input.isMainBranch ?? false,
      },
      include: {
        director: {
          select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true },
        },
        manager: {
          select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true },
        },
      },
    });
  }

  static async updateBranch(
    branchId: string,
    input: Partial<CreateBranchInput>,
    operator?: { role?: string; branchId?: string | null }
  ) {
    if (operator?.role === UserRole.BRANCH_ADMIN) {
      if (operator.branchId && operator.branchId !== branchId) {
        throw new ForbiddenError("Branch administrators cannot modify other campus branches.");
      }
      // Branch admins cannot change branch code or designate themselves as main branch
      delete (input as any).isMainBranch;
      delete (input as any).code;
    }

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundError("Branch not found");
    }

    if (input.code && input.code !== branch.code) {
      const existing = await prisma.branch.findUnique({
        where: { code: input.code },
      });
      if (existing) {
        throw new BadRequestError(`Branch code '${input.code}' is already taken`);
      }
    }

    const dataToUpdate: any = { ...input };
    if ("directorId" in input) {
      dataToUpdate.directorId = input.directorId && input.directorId.trim().length > 0 ? input.directorId : null;
    }
    if ("managerId" in input) {
      dataToUpdate.managerId = input.managerId && input.managerId.trim().length > 0 ? input.managerId : null;
    }

    if (input.isMainBranch === true) {
      // Demote all other branches for this institution
      await prisma.branch.updateMany({
        where: { institutionId: branch.institutionId, isMainBranch: true },
        data: { isMainBranch: false },
      });

      // Synchronize institution headquarters address, phone, and whatsapp
      const targetAddress = input.address ?? branch.address;
      const targetPhone = input.phone ?? branch.phone;
      const targetWhatsapp = input.whatsappNumber ?? branch.whatsappNumber;
      await prisma.institution.update({
        where: { id: branch.institutionId },
        data: {
          ...(targetAddress ? { address: targetAddress } : {}),
          ...(targetPhone ? { phone: targetPhone } : {}),
          ...(targetWhatsapp ? { whatsappNumber: targetWhatsapp } : {}),
        },
      });
    } else if (branch.isMainBranch) {
      // If updating the active main branch's address, phone, or whatsapp, keep institution in sync
      const targetAddress = input.address ?? branch.address;
      const targetPhone = input.phone ?? branch.phone;
      const targetWhatsapp = input.whatsappNumber ?? branch.whatsappNumber;
      if (input.address || input.phone || input.whatsappNumber) {
        await prisma.institution.update({
          where: { id: branch.institutionId },
          data: {
            ...(targetAddress ? { address: targetAddress } : {}),
            ...(targetPhone ? { phone: targetPhone } : {}),
            ...(targetWhatsapp ? { whatsappNumber: targetWhatsapp } : {}),
          },
        });
      }
    }

    return prisma.branch.update({
      where: { id: branchId },
      data: dataToUpdate,
      include: {
        director: {
          select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true },
        },
        manager: {
          select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true },
        },
      },
    });
  }

  static async setMainBranch(branchId: string) {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundError("Branch not found");
    }

    // Demote any current main branches
    await prisma.branch.updateMany({
      where: { institutionId: branch.institutionId, isMainBranch: true },
      data: { isMainBranch: false },
    });

    // Designate this branch as the primary main branch and ensure it is active
    const updated = await prisma.branch.update({
      where: { id: branchId },
      data: { isMainBranch: true, isActive: true },
      include: {
        director: {
          select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true },
        },
        manager: {
          select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true },
        },
      },
    });

    // Auto-sync headquarters address, phone, and whatsapp on the institution profile
    await prisma.institution.update({
      where: { id: branch.institutionId },
      data: {
        ...(branch.address ? { address: branch.address } : {}),
        ...(branch.phone ? { phone: branch.phone } : {}),
        ...(branch.whatsappNumber ? { whatsappNumber: branch.whatsappNumber } : {}),
      },
    });

    return updated;
  }

  static async toggleBranchStatus(branchId: string) {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundError("Branch not found");
    }

    return prisma.branch.update({
      where: { id: branchId },
      data: { isActive: !branch.isActive },
    });
  }

  static async deleteBranch(branchId: string, operator?: { role?: string }) {
    if (operator && operator.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError("Only Super Administrators can delete a campus branch.");
    }

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundError("Branch not found");
    }

    if (branch.isMainBranch) {
      throw new BadRequestError(
        "Cannot delete the Main Campus (Headquarters). Please designate another campus branch as the Main Campus first."
      );
    }

    await prisma.branch.delete({
      where: { id: branchId },
    });

    await PublicService.invalidateLandingCache();

    return { id: branchId, name: branch.name };
  }

  // ==========================================
  // TEACHERS & FACULTY MANAGEMENT
  // ==========================================
  static async listTeachers(branchId?: string) {
    const where: any = {
      role: UserRole.TEACHER,
      deletedAt: null,
    };
    if (branchId) {
      where.branchId = branchId;
    }

    const teachers = await prisma.user.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        teacherProfile: {
          include: {
            batches: {
              where: { deletedAt: null },
              select: { id: true, name: true, course: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return teachers.map((t) => ({
      id: t.id,
      fullName: t.fullName,
      email: t.email,
      phone: t.phone,
      avatarUrl: t.avatarUrl,
      branch: t.branch,
      qualification: t.teacherProfile?.qualification,
      specialization: t.teacherProfile?.specialization,
      bio: t.teacherProfile?.bio,
      batches: t.teacherProfile?.batches || [],
      isActive: t.isActive,
      createdAt: t.createdAt,
    }));
  }

  static async createTeacher(
    institutionId: string | undefined,
    input: CreateTeacherInput,
    operator?: { role?: string; branchId?: string | null }
  ) {
    if (operator?.role === UserRole.BRANCH_ADMIN) {
      if (operator.branchId && input.branchId !== operator.branchId) {
        throw new ForbiddenError("Branch administrators can only add faculty to their assigned branch.");
      }
    }

    const branch = await prisma.branch.findUnique({
      where: { id: input.branchId },
    });
    if (!branch) {
      throw new NotFoundError("Branch not found");
    }
    const effectiveInstitutionId =
      institutionId && institutionId.trim().length > 0 ? institutionId : branch.institutionId;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { phone: input.phone }],
      },
    });
    if (existing) {
      throw new BadRequestError(
        existing.email === input.email
          ? "A user with this email already exists"
          : "A user with this phone number already exists"
      );
    }

    const plainPassword = input.password && input.password.trim().length > 0 ? input.password : input.email;
    const isDefaultPassword = !input.password || input.password.trim().length === 0;
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        institutionId: effectiveInstitutionId,
        branchId: input.branchId,
        email: input.email,
        phone: input.phone,
        fullName: input.fullName,
        role: UserRole.TEACHER,
        passwordHash,
        teacherProfile: {
          create: {
            qualification: input.qualification,
            specialization: input.specialization,
            bio: input.bio,
          },
        },
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        teacherProfile: true,
      },
    });

    return {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      branch: newUser.branch,
      role: newUser.role,
      specialization: newUser.teacherProfile?.specialization,
      isDefaultPassword,
      credentialsNote: isDefaultPassword
        ? `Faculty account created. Default password is the email: ${newUser.email}`
        : "Faculty account created with custom password.",
    };
  }

  // ==========================================
  // STAFF & CAMPUS ADMINISTRATION
  // ==========================================
  static async listStaffs(branchId?: string) {
    const where: any = {
      role: { in: [UserRole.STAFF, UserRole.BRANCH_ADMIN] },
      deletedAt: null,
    };
    if (branchId) {
      where.branchId = branchId;
    }

    const staffs = await prisma.user.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        staffProfile: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return staffs.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      email: s.email,
      phone: s.phone,
      role: s.role,
      branch: s.branch,
      designation: s.staffProfile?.designation,
      department: s.staffProfile?.department,
      isActive: s.isActive,
      createdAt: s.createdAt,
    }));
  }

  static async createStaff(
    institutionId: string | undefined,
    input: CreateStaffInput,
    operator?: { role?: string; branchId?: string | null }
  ) {
    if (operator?.role === UserRole.BRANCH_ADMIN) {
      if (operator.branchId && input.branchId !== operator.branchId) {
        throw new ForbiddenError("Branch administrators can only add staff to their assigned branch.");
      }
    }

    const branch = await prisma.branch.findUnique({
      where: { id: input.branchId },
    });
    if (!branch) {
      throw new NotFoundError("Branch not found");
    }
    const effectiveInstitutionId =
      institutionId && institutionId.trim().length > 0 ? institutionId : branch.institutionId;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { phone: input.phone }],
      },
    });
    if (existing) {
      throw new BadRequestError(
        existing.email === input.email
          ? "A user with this email already exists"
          : "A user with this phone number already exists"
      );
    }

    const plainPassword = input.password && input.password.trim().length > 0 ? input.password : input.email;
    const isDefaultPassword = !input.password || input.password.trim().length === 0;
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const assignedRole = input.role === "BRANCH_ADMIN" ? UserRole.BRANCH_ADMIN : UserRole.STAFF;

    const newUser = await prisma.user.create({
      data: {
        institutionId: effectiveInstitutionId,
        branchId: input.branchId,
        email: input.email,
        phone: input.phone,
        fullName: input.fullName,
        role: assignedRole,
        passwordHash,
        staffProfile: {
          create: {
            designation: input.designation,
            department: input.department,
          },
        },
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        staffProfile: true,
      },
    });

    return {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      branch: newUser.branch,
      designation: newUser.staffProfile?.designation,
      isDefaultPassword,
      credentialsNote: isDefaultPassword
        ? `${assignedRole === UserRole.BRANCH_ADMIN ? "Branch Administrator" : "Staff"} account created. Default password is the email: ${newUser.email}`
        : `${assignedRole === UserRole.BRANCH_ADMIN ? "Branch Administrator" : "Staff"} account created with custom password.`,
    };
  }

  static async updateTeacher(
    teacherId: string,
    input: UpdateTeacherInput,
    operator?: { role?: string; branchId?: string | null }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: teacherId },
      include: { teacherProfile: true },
    });
    if (!user || user.role !== UserRole.TEACHER) {
      throw new NotFoundError("Teacher not found");
    }

    if (operator?.role === UserRole.BRANCH_ADMIN) {
      if (user.branchId !== operator.branchId || (input.branchId && input.branchId !== operator.branchId)) {
        throw new ForbiddenError("Branch administrators can only manage faculty from their assigned branch.");
      }
    }

    if (input.branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: input.branchId } });
      if (!branch) throw new NotFoundError("Branch not found");
    }

    if (input.phone && input.phone !== user.phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone: input.phone } });
      if (existingPhone) throw new BadRequestError("Phone number already taken by another user");
    }

    return prisma.user.update({
      where: { id: teacherId },
      data: {
        fullName: input.fullName,
        phone: input.phone,
        branchId: input.branchId,
        avatarUrl: input.avatarUrl,
        isActive: input.isActive,
        teacherProfile: {
          upsert: {
            create: {
              qualification: input.qualification,
              specialization: input.specialization || "General",
              bio: input.bio,
            },
            update: {
              qualification: input.qualification,
              specialization: input.specialization,
              bio: input.bio,
            },
          },
        },
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        teacherProfile: true,
      },
    });
  }

  static async updateStaff(
    staffId: string,
    input: UpdateStaffInput,
    operator?: { role?: string; branchId?: string | null }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: staffId },
      include: { staffProfile: true },
    });
    if (!user || (user.role !== UserRole.STAFF && user.role !== UserRole.BRANCH_ADMIN)) {
      throw new NotFoundError("Staff member or branch administrator not found");
    }

    if (operator?.role === UserRole.BRANCH_ADMIN) {
      if (user.branchId !== operator.branchId || (input.branchId && input.branchId !== operator.branchId)) {
        throw new ForbiddenError("Branch administrators can only manage staff from their assigned branch.");
      }
    }

    if (input.branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: input.branchId } });
      if (!branch) throw new NotFoundError("Branch not found");
    }

    if (input.phone && input.phone !== user.phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone: input.phone } });
      if (existingPhone) throw new BadRequestError("Phone number already taken by another user");
    }

    const assignedRole = input.role
      ? input.role === "BRANCH_ADMIN"
        ? UserRole.BRANCH_ADMIN
        : UserRole.STAFF
      : undefined;

    return prisma.user.update({
      where: { id: staffId },
      data: {
        fullName: input.fullName,
        phone: input.phone,
        branchId: input.branchId,
        avatarUrl: input.avatarUrl,
        isActive: input.isActive,
        ...(assignedRole ? { role: assignedRole } : {}),
        staffProfile: {
          upsert: {
            create: {
              designation: input.designation || "Executive",
              department: input.department,
            },
            update: {
              designation: input.designation,
              department: input.department,
            },
          },
        },
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        staffProfile: true,
      },
    });
  }

  // ========================================================
  // TESTIMONIALS MODERATION
  // ========================================================
  static async listTestimonials(isApproved?: boolean) {
    const where: any = {};
    if (typeof isApproved === "boolean") {
      where.isApproved = isApproved;
    }
    return prisma.testimonial.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  static async updateTestimonialStatus(id: string, isApproved: boolean) {
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Testimonial not found");
    const updated = await prisma.testimonial.update({
      where: { id },
      data: { isApproved },
    });
    PublicService.invalidateLandingCache();
    return updated;
  }

  static async createTestimonial(data: {
    name: string;
    role?: string;
    phone?: string | null;
    message: string;
    rating?: number;
    isApproved?: boolean;
  }) {
    const created = await prisma.testimonial.create({
      data: {
        name: data.name,
        role: data.role || "STUDENT",
        phone: data.phone || null,
        message: data.message,
        rating: Math.min(5, Math.max(1, data.rating || 5)),
        isApproved: data.isApproved !== undefined ? data.isApproved : true,
      },
    });
    PublicService.invalidateLandingCache();
    return created;
  }

  static async updateTestimonial(
    id: string,
    data: {
      name?: string;
      role?: string;
      phone?: string | null;
      message?: string;
      rating?: number;
      isApproved?: boolean;
    }
  ) {
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Testimonial not found");
    const updated = await prisma.testimonial.update({
      where: { id },
      data: {
        ...data,
        rating: data.rating ? Math.min(5, Math.max(1, data.rating)) : undefined,
      },
    });
    PublicService.invalidateLandingCache();
    return updated;
  }

  static async deleteTestimonial(id: string) {
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Testimonial not found");
    const deleted = await prisma.testimonial.delete({ where: { id } });
    PublicService.invalidateLandingCache();
    return deleted;
  }

  // ========================================================
  // STUDENT ACHIEVEMENTS (HALL OF FAME)
  // ========================================================
  static async listAchievements(search?: string, isFeatured?: boolean) {
    const where: any = {};
    if (typeof isFeatured === "boolean") {
      where.isFeatured = isFeatured;
    }
    if (search) {
      where.OR = [
        { studentName: { contains: search, mode: "insensitive" } },
        { achievement: { contains: search, mode: "insensitive" } },
        { college: { contains: search, mode: "insensitive" } },
        { batchName: { contains: search, mode: "insensitive" } },
        { year: { contains: search, mode: "insensitive" } },
      ];
    }
    return prisma.studentAchievement.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  static async createAchievement(data: {
    studentName: string;
    avatarUrl?: string | null;
    batchName: string;
    achievement: string;
    college?: string | null;
    year?: string;
    posterUrl?: string | null;
    isFeatured?: boolean;
    displayOrder?: number;
  }) {
    const created = await prisma.studentAchievement.create({
      data: {
        studentName: data.studentName,
        avatarUrl: data.avatarUrl || null,
        batchName: data.batchName,
        achievement: data.achievement,
        college: data.college || null,
        year: data.year || "2025",
        posterUrl: data.posterUrl || null,
        isFeatured: data.isFeatured !== undefined ? data.isFeatured : true,
        displayOrder: data.displayOrder ?? 0,
      },
    });
    PublicService.invalidateLandingCache();
    return created;
  }

  static async updateAchievement(
    id: string,
    data: {
      studentName?: string;
      avatarUrl?: string | null;
      batchName?: string;
      achievement?: string;
      college?: string | null;
      year?: string;
      posterUrl?: string | null;
      isFeatured?: boolean;
      displayOrder?: number;
    }
  ) {
    const existing = await prisma.studentAchievement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Student achievement not found");
    const updated = await prisma.studentAchievement.update({
      where: { id },
      data,
    });
    PublicService.invalidateLandingCache();
    return updated;
  }

  static async toggleAchievementFeatured(id: string, isFeatured: boolean) {
    const existing = await prisma.studentAchievement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Student achievement not found");
    const updated = await prisma.studentAchievement.update({
      where: { id },
      data: { isFeatured },
    });
    PublicService.invalidateLandingCache();
    return updated;
  }

  static async deleteAchievement(id: string) {
    const existing = await prisma.studentAchievement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Student achievement not found");
    const deleted = await prisma.studentAchievement.delete({ where: { id } });
    PublicService.invalidateLandingCache();
    return deleted;
  }

  // ========================================================
  // FACULTY TIPS & ACADEMIC GUIDES
  // ========================================================
  static async listFacultyTips(search?: string, category?: string, isPublished?: boolean) {
    const where: any = {};
    if (typeof isPublished === "boolean") {
      where.isPublished = isPublished;
    }
    if (category && category !== "ALL") {
      where.category = { equals: category, mode: "insensitive" };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }
    return prisma.facultyTip.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  static async createFacultyTip(data: {
    category: string;
    title: string;
    slug?: string | null;
    excerpt: string;
    content: string;
    author: string;
    authorTitle?: string | null;
    authorImage?: string | null;
    coverImage?: string | null;
    readTime?: string;
    isPublished?: boolean;
    displayOrder?: number;
  }) {
    const generatedSlug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const created = await prisma.facultyTip.create({
      data: {
        category: data.category,
        title: data.title,
        slug: generatedSlug,
        excerpt: data.excerpt,
        content: data.content,
        author: data.author,
        authorTitle: data.authorTitle || null,
        authorImage: data.authorImage || null,
        coverImage: data.coverImage || null,
        readTime: data.readTime || "4 min read",
        isPublished: data.isPublished !== undefined ? data.isPublished : true,
        displayOrder: data.displayOrder ?? 0,
      },
    });
    PublicService.invalidateLandingCache();
    return created;
  }

  static async updateFacultyTip(
    id: string,
    data: {
      category?: string;
      title?: string;
      slug?: string | null;
      excerpt?: string;
      content?: string;
      author?: string;
      authorTitle?: string | null;
      authorImage?: string | null;
      coverImage?: string | null;
      readTime?: string;
      isPublished?: boolean;
      displayOrder?: number;
    }
  ) {
    const existing = await prisma.facultyTip.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Faculty tip not found");
    const updated = await prisma.facultyTip.update({
      where: { id },
      data,
    });
    PublicService.invalidateLandingCache();
    return updated;
  }

  static async toggleFacultyTipPublished(id: string, isPublished: boolean) {
    const existing = await prisma.facultyTip.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Faculty tip not found");
    const updated = await prisma.facultyTip.update({
      where: { id },
      data: { isPublished },
    });
    PublicService.invalidateLandingCache();
    return updated;
  }

  static async deleteFacultyTip(id: string) {
    const existing = await prisma.facultyTip.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Faculty tip not found");
    const deleted = await prisma.facultyTip.delete({ where: { id } });
    PublicService.invalidateLandingCache();
    return deleted;
  }
}

