import { prisma } from "../../config/prisma.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../common/errors/appError.js";
import { BatchStatus, EnrollmentStatus, PaymentMethod, InvoiceStatus } from "@prisma/client";
import { generateInvoiceNumber, generateReceiptNumber } from "../../common/utils/identifierGenerator.js";
import { UserRole, type JwtUserPayload } from "../../types/index.js";


import type {
  CreateCourseInput,
  CreateBatchInput,
  UpdateBatchInput,
  EnrollStudentInput,
  SelfEnrollBatchInput,
  CreateStudyMaterialInput,
  BatchCurriculumInput,
} from "./batch.schema.js";

export class BatchService {
  // ==========================================
  // COURSES MANAGEMENT (ONLINE / CURRICULUM)
  // ==========================================
  static async listCourses(branchId?: string) {
    const where: any = { deletedAt: null };
    if (branchId) where.branchId = branchId;

    return prisma.course.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        _count: { select: { batches: true, studyMaterials: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createCourse(input: CreateCourseInput, defaultBranchId?: string) {
    const branchId = input.branchId || defaultBranchId;
    if (!branchId) {
      const firstBranch = await prisma.branch.findFirst({ select: { id: true } });
      if (!firstBranch) throw new NotFoundError("No branch found to assign course");
    }

    const targetBranchId = (branchId || (await prisma.branch.findFirst({ select: { id: true } }))?.id)!;

    const existing = await prisma.course.findUnique({
      where: {
        branchId_code: {
          branchId: targetBranchId,
          code: input.code.toUpperCase(),
        },
      },
    });

    if (existing) {
      throw new BadRequestError(`Course with code '${input.code}' already exists in this campus`);
    }

    return prisma.course.create({
      data: {
        branchId: targetBranchId,
        name: input.name,
        code: input.code.toUpperCase(),
        description: input.description,
        durationWeeks: input.durationWeeks,
        feeAmount: input.feeAmount,
        coverImage: input.coverImage,
        isPublic: input.isPublic,
        isPublished: input.isPublished,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });
  }

  // ==========================================
  // OFFLINE BATCHES MANAGEMENT
  // ==========================================
  static async listBatches(filter: {
    branchId?: string;
    courseId?: string;
    academicClassId?: string;
    status?: BatchStatus;
    isPublicOnly?: boolean;
  }) {
    const where: any = { deletedAt: null };
    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.courseId) where.courseId = filter.courseId;
    if (filter.academicClassId) where.academicClassId = filter.academicClassId;
    if (filter.status) where.status = filter.status;
    if (filter.isPublicOnly) where.isPublic = true;

    const batches = await prisma.batch.findMany({
      where,
      include: {
        academicClass: { select: { id: true, name: true, code: true, academicYear: true, category: true } },
        course: { select: { id: true, name: true, code: true, feeAmount: true } },
        branch: { select: { id: true, name: true, code: true, address: true, phone: true } },
        teacher: {
          include: {
            user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
          },
        },
        enrollments: {
          select: { id: true, status: true },
        },
        _count: { select: { exams: true, studyMaterials: true } },
      },
      orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
    });

    return batches.map((b) => {
      const activeEnrollments = b.enrollments.filter((e) => e.status === EnrollmentStatus.ACTIVE).length;
      const pendingEnrollments = b.enrollments.filter((e) => e.status === EnrollmentStatus.PENDING_VERIFICATION).length;
      const seatLimit = b.seatLimit || b.maxCapacity || 40;
      const availableSeats = Math.max(0, seatLimit - activeEnrollments);

      return {
        id: b.id,
        name: b.name,
        title: b.title || b.name,
        coverImage: b.coverImage,
        classroom: b.classroom,
        classTime: b.classTime || b.scheduleTime,
        scheduleTime: b.scheduleTime || b.classTime,
        startDate: b.startDate.toISOString().split("T")[0],
        endDate: b.endDate ? b.endDate.toISOString().split("T")[0] : null,
        seatLimit,
        maxCapacity: seatLimit,
        enrolledCount: activeEnrollments,
        pendingCount: pendingEnrollments,
        availableSeats,
        isHouseFull: availableSeats <= 0,
        totalClasses: b.totalClasses,
        totalExams: b.totalExams,
        classesPerWeek: b.classesPerWeek,
        daysOfWeek: b.daysOfWeek || [],
        feeAmount: Number(b.feeAmount),
        feeType: b.feeType,
        subjects: b.subjects || [],
        subjectTeachers: b.subjectTeachers || [],
        classModules: b.classModules || [],
        routine: b.routine || [],
        isPublic: b.isPublic,
        status: b.status,
        academicClass: b.academicClass,
        course: b.course,
        branch: b.branch,
        teacher: b.teacher?.user
          ? {
              id: b.teacher.user.id,
              fullName: b.teacher.user.fullName,
              email: b.teacher.user.email,
              phone: b.teacher.user.phone,
              avatarUrl: b.teacher.user.avatarUrl,
            }
          : null,
        examsCount: b._count.exams,
        materialsCount: b._count.studyMaterials,
      };
    });
  }

  static async getBatch(id: string) {
    const b = await prisma.batch.findUnique({
      where: { id },
      include: {
        academicClass: true,
        course: true,
        branch: true,
        teacher: {
          include: {
            user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
          },
        },
        enrollments: {
          select: { id: true, status: true },
        },
        exams: {
          select: {
            id: true,
            title: true,
            subject: true,
            examType: true,
            totalMarks: true,
            passMarks: true,
            examDate: true,
            instructions: true,
            _count: { select: { results: true } },
          },
          orderBy: { examDate: "asc" },
        },
        _count: { select: { exams: true, studyMaterials: true } },
      },
    });

    if (!b || b.deletedAt) {
      throw new NotFoundError("Batch not found");
    }

    const activeEnrollments = b.enrollments.filter((e) => e.status === EnrollmentStatus.ACTIVE).length;
    const pendingEnrollments = b.enrollments.filter((e) => e.status === EnrollmentStatus.PENDING_VERIFICATION).length;
    const seatLimit = b.seatLimit || b.maxCapacity || 40;
    const availableSeats = Math.max(0, seatLimit - activeEnrollments);

    return {
      id: b.id,
      name: b.name,
      title: b.title || b.name,
      coverImage: b.coverImage,
      classroom: b.classroom,
      classTime: b.classTime || b.scheduleTime,
      scheduleTime: b.scheduleTime || b.classTime,
      startDate: b.startDate.toISOString().split("T")[0],
      endDate: b.endDate ? b.endDate.toISOString().split("T")[0] : null,
      seatLimit,
      maxCapacity: seatLimit,
      enrolledCount: activeEnrollments,
      pendingCount: pendingEnrollments,
      availableSeats,
      isHouseFull: availableSeats <= 0,
      totalClasses: b.totalClasses,
      totalExams: b.totalExams,
      classesPerWeek: b.classesPerWeek,
      daysOfWeek: b.daysOfWeek || [],
      feeAmount: Number(b.feeAmount),
      feeType: b.feeType,
      subjects: b.subjects || [],
      subjectTeachers: b.subjectTeachers || [],
      classModules: b.classModules || [],
      routine: b.routine || [],
      exams: (b.exams || []).map((ex) => ({
        id: ex.id,
        title: ex.title,
        subject: ex.subject,
        examType: ex.examType,
        totalMarks: Number(ex.totalMarks),
        passMarks: Number(ex.passMarks),
        examDate: ex.examDate.toISOString().split("T")[0],
        instructions: ex.instructions,
        resultsCount: ex._count.results,
      })),
      isPublic: b.isPublic,
      status: b.status,
      academicClass: b.academicClass,
      course: b.course,
      branch: b.branch,
      teacher: b.teacher?.user
        ? {
            id: b.teacher.user.id,
            fullName: b.teacher.user.fullName,
            email: b.teacher.user.email,
            phone: b.teacher.user.phone,
            avatarUrl: b.teacher.user.avatarUrl,
          }
        : null,
      examsCount: b._count.exams,
      materialsCount: b._count.studyMaterials,
    };
  }

  private static async resolveTeacherProfileId(teacherId?: string | null): Promise<string | null> {
    if (!teacherId || typeof teacherId !== "string" || !teacherId.trim()) return null;
    const cleanId = teacherId.trim();

    // 1. Direct match with TeacherProfile.id
    const profile = await prisma.teacherProfile.findUnique({
      where: { id: cleanId },
      select: { id: true },
    });
    if (profile) return profile.id;

    // 2. Match with TeacherProfile by userId
    const profileByUser = await prisma.teacherProfile.findUnique({
      where: { userId: cleanId },
      select: { id: true },
    });
    if (profileByUser) return profileByUser.id;

    // 3. User with TEACHER role exists but has no TeacherProfile record yet
    const teacherUser = await prisma.user.findUnique({
      where: { id: cleanId },
      include: { teacherProfile: true },
    });
    if (teacherUser) {
      if (teacherUser.teacherProfile) return teacherUser.teacherProfile.id;
      const created = await prisma.teacherProfile.create({
        data: { userId: teacherUser.id },
      });
      return created.id;
    }

    return null;
  }

  private static async resolveCourseId(courseId?: string | null): Promise<string | null> {
    if (!courseId || typeof courseId !== "string" || !courseId.trim()) return null;
    const course = await prisma.course.findUnique({
      where: { id: courseId.trim() },
      select: { id: true },
    });
    return course ? course.id : null;
  }

  private static async resolveAcademicClassId(classId?: string | null): Promise<string | null> {
    if (!classId || typeof classId !== "string" || !classId.trim()) return null;
    const ac = await prisma.academicClass.findUnique({
      where: { id: classId.trim() },
      select: { id: true },
    });
    return ac ? ac.id : null;
  }

  static async createBatch(input: CreateBatchInput, defaultBranchId?: string) {
    const branchId = input.branchId || defaultBranchId;
    if (!branchId) {
      const firstBranch = await prisma.branch.findFirst({ select: { id: true } });
      if (!firstBranch) throw new NotFoundError("No branch found to assign batch");
    }

    const targetBranchId = (branchId || (await prisma.branch.findFirst({ select: { id: true } }))?.id)!;

    const seatCap = input.seatLimit || input.maxCapacity || 40;
    const resolvedTeacherId = await this.resolveTeacherProfileId(input.teacherId);
    const resolvedCourseId = await this.resolveCourseId(input.courseId);
    const resolvedClassId = await this.resolveAcademicClassId(input.academicClassId);

    const startDate = input.startDate && !isNaN(new Date(input.startDate).getTime())
      ? new Date(input.startDate)
      : new Date();
    const endDate = input.endDate && !isNaN(new Date(input.endDate).getTime())
      ? new Date(input.endDate)
      : null;

    return prisma.batch.create({
      data: {
        branchId: targetBranchId,
        courseId: resolvedCourseId,
        academicClassId: resolvedClassId,
        teacherId: resolvedTeacherId,
        name: input.name.trim(),
        title: (input.title && input.title.trim()) || input.name.trim(),
        coverImage: input.coverImage && input.coverImage.trim() ? input.coverImage.trim() : null,
        startDate,
        endDate,
        seatLimit: seatCap,
        maxCapacity: seatCap,
        totalClasses: input.totalClasses || 36,
        totalExams: input.totalExams || 12,
        classesPerWeek: input.classesPerWeek || 3,
        daysOfWeek: input.daysOfWeek || [],
        classTime: input.classTime || input.scheduleTime || null,
        scheduleTime: input.scheduleTime || input.classTime || null,
        classroom: input.classroom && input.classroom.trim() ? input.classroom.trim() : null,
        feeAmount: input.feeAmount !== undefined ? input.feeAmount : 6000,
        feeType: input.feeType || "ONE_TIME",
        subjects: input.subjects || [],
        subjectTeachers: input.subjectTeachers || [],
        classModules: input.classModules || [],
        routine: input.routine || [],
        isPublic: input.isPublic !== undefined ? input.isPublic : true,
        status: input.status || BatchStatus.UPCOMING,
      },
      include: {
        academicClass: { select: { id: true, name: true, code: true } },
        course: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });
  }

  static async updateBatch(id: string, input: UpdateBatchInput, user?: JwtUserPayload) {
    const existing = await prisma.batch.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundError("Batch not found");
    }

    if (user?.role === UserRole.BRANCH_ADMIN) {
      if (user.branchId && existing.branchId !== user.branchId) {
        throw new ForbiddenError("Branch administrators cannot modify batches of other campuses.");
      }
      if (input.branchId && input.branchId !== user.branchId) {
        delete input.branchId;
      }
    }

    const seatCap = input.seatLimit !== undefined ? input.seatLimit : input.maxCapacity !== undefined ? input.maxCapacity : undefined;
    const resolvedTeacherId = input.teacherId !== undefined ? await this.resolveTeacherProfileId(input.teacherId) : undefined;
    const resolvedCourseId = input.courseId !== undefined ? await this.resolveCourseId(input.courseId) : undefined;
    const resolvedClassId = input.academicClassId !== undefined ? await this.resolveAcademicClassId(input.academicClassId) : undefined;

    const startDate = input.startDate && !isNaN(new Date(input.startDate).getTime())
      ? new Date(input.startDate)
      : undefined;
    const endDate = input.endDate !== undefined
      ? (input.endDate && !isNaN(new Date(input.endDate).getTime()) ? new Date(input.endDate) : null)
      : undefined;

    return prisma.batch.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name.trim() }),
        ...(input.title !== undefined && { title: input.title && input.title.trim() ? input.title.trim() : null }),
        ...(resolvedCourseId !== undefined && { courseId: resolvedCourseId }),
        ...(resolvedClassId !== undefined && { academicClassId: resolvedClassId }),
        ...(input.branchId && { branchId: input.branchId }),
        ...(resolvedTeacherId !== undefined && { teacherId: resolvedTeacherId }),
        ...(startDate && { startDate }),
        ...(endDate !== undefined && { endDate }),
        ...(seatCap !== undefined && { seatLimit: seatCap, maxCapacity: seatCap }),
        ...(input.totalClasses !== undefined && { totalClasses: input.totalClasses }),
        ...(input.totalExams !== undefined && { totalExams: input.totalExams }),
        ...(input.classesPerWeek !== undefined && { classesPerWeek: input.classesPerWeek }),
        ...(input.daysOfWeek !== undefined && { daysOfWeek: input.daysOfWeek }),
        ...(input.classTime !== undefined && { classTime: input.classTime || null, scheduleTime: input.classTime || null }),
        ...(input.scheduleTime !== undefined && { scheduleTime: input.scheduleTime || null, classTime: input.scheduleTime || null }),
        ...(input.classroom !== undefined && { classroom: input.classroom && input.classroom.trim() ? input.classroom.trim() : null }),
        ...(input.feeAmount !== undefined && { feeAmount: input.feeAmount }),
        ...(input.feeType !== undefined && { feeType: input.feeType }),
        ...(input.coverImage !== undefined && { coverImage: input.coverImage && input.coverImage.trim() ? input.coverImage.trim() : null }),
        ...(input.subjects !== undefined && { subjects: input.subjects }),
        ...(input.subjectTeachers !== undefined && { subjectTeachers: input.subjectTeachers }),
        ...(input.classModules !== undefined && { classModules: input.classModules }),
        ...(input.routine !== undefined && { routine: input.routine }),
        ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
        ...(input.status && { status: input.status }),
      },
      include: {
        academicClass: { select: { id: true, name: true, code: true } },
        course: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });
  }

  static async updateBatchCurriculum(id: string, input: BatchCurriculumInput, user?: JwtUserPayload) {
    const existing = await prisma.batch.findUnique({
      where: { id },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundError("Batch not found");
    }

    if (user?.role === UserRole.BRANCH_ADMIN) {
      if (user.branchId && existing.branchId !== user.branchId) {
        throw new ForbiddenError("Branch administrators cannot modify batches of other campuses.");
      }
    }

    // 1. Resolve subject teachers to actual TeacherProfile.id or User.id
    const resolvedSubjectTeachers = await Promise.all(
      (input.subjectTeachers || []).map(async (st) => {
        const resolvedId = await this.resolveTeacherProfileId(st.teacherId);
        return {
          subject: st.subject,
          teacherId: resolvedId || st.teacherId || null,
          teacherName: st.teacherName || undefined,
        };
      })
    );

    // 2. Resolve class module teachers
    const resolvedClassModules = await Promise.all(
      (input.classModules || []).map(async (cm, idx) => {
        const resolvedId = await this.resolveTeacherProfileId(cm.teacherId);
        return {
          classNumber: cm.classNumber || idx + 1,
          weekOrClass: cm.weekOrClass || `Lecture ${String(idx + 1).padStart(2, "0")}`,
          title: cm.title.trim(),
          subject: cm.subject || null,
          date: cm.date || null,
          time: cm.time || null,
          teacherId: resolvedId || cm.teacherId || null,
          teacherName: cm.teacherName || undefined,
          room: cm.room || null,
          topics: cm.topics || [],
        };
      })
    );

    // 3. Update Batch columns and synchronize Exam table in transaction
    const totalClassesCount = resolvedClassModules.length > 0 ? resolvedClassModules.length : existing.totalClasses;
    const totalExamsCount = input.exams && input.exams.length > 0 ? input.exams.length : existing.totalExams;

    const updatedBatch = await prisma.$transaction(async (tx) => {
      const b = await tx.batch.update({
        where: { id },
        data: {
          subjects: input.subjects,
          subjectTeachers: resolvedSubjectTeachers,
          classModules: resolvedClassModules,
          routine: input.routine,
          ...(input.daysOfWeek && { daysOfWeek: input.daysOfWeek }),
          ...(input.classTime && { classTime: input.classTime, scheduleTime: input.classTime }),
          ...(input.classroom && { classroom: input.classroom }),
          totalClasses: totalClassesCount,
          totalExams: totalExamsCount,
        },
      });

      // 4. Synchronize Exam table
      if (input.exams && Array.isArray(input.exams)) {
        for (const ex of input.exams) {
          const examDate = ex.examDate && !isNaN(new Date(ex.examDate).getTime())
            ? new Date(ex.examDate)
            : new Date();

          if (ex.id) {
            // Check if exam exists for this batch
            const existingExam = await tx.exam.findFirst({
              where: { id: ex.id, batchId: id },
            });
            if (existingExam) {
              await tx.exam.update({
                where: { id: ex.id },
                data: {
                  title: ex.title.trim(),
                  subject: ex.subject || null,
                  examType: ex.examType,
                  examDate,
                  totalMarks: ex.totalMarks,
                  passMarks: ex.passMarks,
                  instructions: ex.instructions || null,
                },
              });
              continue;
            }
          }

          // If no ID or not found, check if an exam with identical title & batchId exists to avoid duplicates
          const matchingExam = await tx.exam.findFirst({
            where: { batchId: id, title: ex.title.trim() },
          });

          if (matchingExam) {
            await tx.exam.update({
              where: { id: matchingExam.id },
              data: {
                subject: ex.subject || null,
                examType: ex.examType,
                examDate,
                totalMarks: ex.totalMarks,
                passMarks: ex.passMarks,
                instructions: ex.instructions || null,
              },
            });
          } else {
            await tx.exam.create({
              data: {
                batchId: id,
                title: ex.title.trim(),
                subject: ex.subject || null,
                examType: ex.examType,
                examDate,
                totalMarks: ex.totalMarks,
                passMarks: ex.passMarks,
                instructions: ex.instructions || null,
              },
            });
          }
        }
      }

      return b;
    });

    return this.getBatch(updatedBatch.id);
  }

  static async deleteBatch(id: string, user?: JwtUserPayload) {
    const existing = await prisma.batch.findUnique({
      where: { id },
      include: { _count: { select: { enrollments: true } } },
    });
    if (!existing || existing.deletedAt) throw new NotFoundError("Batch not found");

    if (user?.role === UserRole.BRANCH_ADMIN) {
      if (user.branchId && existing.branchId !== user.branchId) {
        throw new ForbiddenError("Branch administrators cannot delete batches of other campuses.");
      }
    }

    if (existing._count.enrollments > 0) {
      // Soft-delete if active enrollments exist
      return prisma.batch.update({
        where: { id },
        data: { deletedAt: new Date(), status: BatchStatus.CANCELLED },
      });
    }

    return prisma.batch.delete({ where: { id } });
  }

  // ==========================================
  // STUDENT SELF-ENROLLMENT & SEAT CONTROL
  // ==========================================
  static async selfEnrollBatch(batchId: string, userId: string, input: SelfEnrollBatchInput) {
    const student = await prisma.studentProfile.findUnique({
      where: { userId },
      include: { user: { select: { fullName: true, email: true, phone: true } } },
    });

    if (!student) {
      throw new NotFoundError("Student profile not found. Please log in with a student account.");
    }

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        enrollments: {
          where: { status: EnrollmentStatus.ACTIVE },
          select: { id: true },
        },
      },
    });

    if (!batch || batch.deletedAt) {
      throw new NotFoundError("Batch not found or is no longer accepting admissions.");
    }

    const seatLimit = batch.seatLimit || batch.maxCapacity || 40;
    if (batch.enrollments.length >= seatLimit) {
      throw new BadRequestError(
        "All physical seats for this offline batch have already been confirmed by enrolled students."
      );
    }

    // Check if student is already enrolled or applied
    const existingEnrollment = await prisma.batchEnrollment.findUnique({
      where: {
        batchId_studentId: {
          batchId,
          studentId: student.id,
        },
      },
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === EnrollmentStatus.ACTIVE) {
        throw new BadRequestError("You are already admitted and confirmed in this batch.");
      }
      if (existingEnrollment.status === EnrollmentStatus.PENDING_VERIFICATION) {
        throw new BadRequestError(
          "You already have a pending admission request awaiting verification for this batch."
        );
      }
    }

    // Create Enrollment in PENDING_VERIFICATION (Does not permanently block seat until approved)
    const enrollment = await prisma.batchEnrollment.upsert({
      where: {
        batchId_studentId: {
          batchId,
          studentId: student.id,
        },
      },
      update: {
        status: EnrollmentStatus.PENDING_VERIFICATION,
        paymentMethod: input.paymentMethod,
        transactionId: input.transactionId,
        senderPhone: input.senderPhone,
        paidAmount: input.paidAmount,
        adminNotes: input.studentNotes || null,
        enrolledAt: new Date(),
      },
      create: {
        batchId,
        studentId: student.id,
        status: EnrollmentStatus.PENDING_VERIFICATION,
        paymentMethod: input.paymentMethod,
        transactionId: input.transactionId,
        senderPhone: input.senderPhone,
        paidAmount: input.paidAmount,
        adminNotes: input.studentNotes || null,
      },
      include: {
        batch: { select: { id: true, name: true, title: true, feeAmount: true, branch: { select: { name: true } } } },
      },
    });

    return {
      message: "Your enrollment request has been submitted successfully for verification.",
      enrollment,
      disclaimer:
        "Please note: Physical seats are officially reserved upon admin payment verification. If batch seat capacity is reached before verification, your admission may be canceled and your fees will be refunded.",
    };
  }

  // ==========================================
  // ADMIN ADMISSION VERIFICATION DESK
  // ==========================================
  static async listPendingEnrollments(branchId?: string) {
    const where: any = { status: EnrollmentStatus.PENDING_VERIFICATION };
    if (branchId) {
      where.batch = { branchId };
    }

    const items = await prisma.batchEnrollment.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
        batch: {
          include: {
            branch: { select: { name: true, code: true } },
            academicClass: { select: { name: true } },
            enrollments: {
              where: { status: EnrollmentStatus.ACTIVE },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { enrolledAt: "asc" },
    });

    return items.map((item) => {
      const confirmedSeats = item.batch.enrollments.length;
      const seatLimit = item.batch.seatLimit || item.batch.maxCapacity || 40;
      const seatsAvailable = Math.max(0, seatLimit - confirmedSeats);

      return {
        id: item.id,
        batchId: item.batchId,
        batchName: item.batch.name,
        batchTitle: item.batch.title || item.batch.name,
        branchName: item.batch.branch.name,
        academicClass: item.batch.academicClass?.name || "General",
        seatLimit,
        confirmedSeats,
        seatsAvailable,
        isSeatAvailable: seatsAvailable > 0,
        studentId: item.studentId,
        rollNumber: item.student.rollNumber,
        studentName: item.student.user.fullName,
        studentEmail: item.student.user.email,
        studentPhone: item.student.user.phone,
        paymentMethod: item.paymentMethod,
        transactionId: item.transactionId,
        senderPhone: item.senderPhone,
        paidAmount: Number(item.paidAmount || item.batch.feeAmount),
        studentNotes: item.adminNotes,
        appliedAt: item.enrolledAt.toISOString(),
      };
    });
  }

  static async verifyEnrollment(
    enrollmentId: string,
    action: "APPROVE" | "REJECT_REFUND",
    adminUserId: string,
    adminNotes?: string
  ) {
    if (action === "APPROVE") {
      return prisma.$transaction(async (tx) => {
        const enrollment = await tx.batchEnrollment.findUnique({
          where: { id: enrollmentId },
          include: {
            batch: true,
            student: {
              include: { user: true },
            },
          },
        });

        if (!enrollment) {
          throw new NotFoundError("Enrollment application not found");
        }

        if (enrollment.status === EnrollmentStatus.ACTIVE) {
          throw new BadRequestError("This enrollment application has already been verified and approved.");
        }

        const seatLimit = enrollment.batch.seatLimit || enrollment.batch.maxCapacity || 40;
        const currentActiveCount = await tx.batchEnrollment.count({
          where: {
            batchId: enrollment.batchId,
            status: EnrollmentStatus.ACTIVE,
          },
        });

        if (currentActiveCount >= seatLimit) {
          throw new BadRequestError(
            `Cannot approve: Physical seat capacity (${seatLimit} seats) for this batch has already been reached.`
          );
        }

        const updated = await tx.batchEnrollment.update({
          where: { id: enrollmentId },
          data: {
            status: EnrollmentStatus.ACTIVE,
            verifiedAt: new Date(),
            verifiedById: adminUserId,
            adminNotes: adminNotes || "Payment verified and seat officially locked.",
          },
        });

        const feeAmount = Number(enrollment.paidAmount || enrollment.batch.feeAmount);
        const invoiceNumber = generateInvoiceNumber();
        const receiptNumber = generateReceiptNumber();

        const invoice = await tx.studentInvoice.create({
          data: {
            studentId: enrollment.studentId,
            batchId: enrollment.batchId,
            branchId: enrollment.batch.branchId,
            invoiceNumber,
            title: `Batch Admission Fee - ${enrollment.batch.name}`,
            subtotal: feeAmount,
            totalAmount: feeAmount,
            paidAmount: feeAmount,
            dueAmount: 0,
            status: InvoiceStatus.PAID,
            dueDate: new Date(),
          },
        });

        const payment = await tx.paymentTransaction.create({
          data: {
            invoiceId: invoice.id,
            studentId: enrollment.studentId,
            receiptNumber,
            amount: feeAmount,
            method: (enrollment.paymentMethod as any) || PaymentMethod.CASH,
            transactionId: enrollment.transactionId || `TRX-${Date.now()}`,
            collectedById: adminUserId,
          },
        });

        return {
          message: "Admission verified and seat officially reserved!",
          enrollment: updated,
          invoice,
          payment,
        };
      });
    } else {
      // REJECT_REFUND
      const enrollment = await prisma.batchEnrollment.findUnique({
        where: { id: enrollmentId },
      });

      if (!enrollment) {
        throw new NotFoundError("Enrollment application not found");
      }

      const updated = await prisma.batchEnrollment.update({
        where: { id: enrollmentId },
        data: {
          status: EnrollmentStatus.CANCELLED_REFUND,
          verifiedAt: new Date(),
          verifiedById: adminUserId,
          adminNotes: adminNotes || "Admission canceled. Fee marked for return to student.",
        },
      });

      return {
        message: "Application canceled and scheduled for fee refund.",
        enrollment: updated,
      };
    }
  }

  // ==========================================
  // DIRECT ADMIN ROSTER MANAGEMENT
  // ==========================================
  static async listRoster(batchId: string) {
    const enrollments = await prisma.batchEnrollment.findMany({
      where: { batchId, status: EnrollmentStatus.ACTIVE },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { enrolledAt: "asc" },
    });

    return enrollments.map((e) => ({
      enrollmentId: e.id,
      studentId: e.studentId,
      rollNumber: e.student.rollNumber,
      fullName: e.student.user.fullName,
      email: e.student.user.email,
      phone: e.student.user.phone,
      guardianName: e.student.guardianName,
      guardianPhone: e.student.guardianPhone,
      status: e.status,
      enrolledAt: e.enrolledAt.toISOString().split("T")[0],
    }));
  }

  static async enrollStudent(
    batchId: string,
    input: EnrollStudentInput,
    operator?: { role?: string; branchId?: string | null }
  ) {
    let studentId = input.studentId;

    if (studentId) {
      const profile = await prisma.studentProfile.findFirst({
        where: { OR: [{ id: studentId }, { userId: studentId }] },
        select: { id: true },
      });
      if (profile) {
        studentId = profile.id;
      }
    } else if (input.rollNumber) {
      const student = await prisma.studentProfile.findUnique({
        where: { rollNumber: input.rollNumber.trim() },
        select: { id: true },
      });
      if (!student) throw new NotFoundError(`No student found with roll number '${input.rollNumber}'`);
      studentId = student.id;
    }

    if (!studentId) throw new BadRequestError("Student ID or Roll Number is required");

    return prisma.$transaction(async (tx) => {
      const batch = await tx.batch.findUnique({
        where: { id: batchId },
        include: {
          _count: {
            select: {
              enrollments: { where: { status: EnrollmentStatus.ACTIVE } },
            },
          },
        },
      });

      if (!batch || batch.deletedAt) throw new NotFoundError("Batch not found");

      if (operator?.role === "BRANCH_ADMIN" && operator.branchId && batch.branchId !== operator.branchId) {
        throw new ForbiddenError("Cannot enroll students into batches of another campus");
      }

      const seatLimit = batch.seatLimit || batch.maxCapacity || 40;
      if (input.status === EnrollmentStatus.ACTIVE && batch._count.enrollments >= seatLimit) {
        throw new BadRequestError(`Batch has reached its physical seat capacity of ${seatLimit} students`);
      }

      return tx.batchEnrollment.upsert({
        where: {
          batchId_studentId: {
            batchId,
            studentId,
          },
        },
        update: { status: input.status },
        create: {
          batchId,
          studentId,
          status: input.status,
        },
      });
    });
  }

  static async removeEnrollment(batchId: string, studentId: string) {
    return prisma.batchEnrollment.delete({
      where: {
        batchId_studentId: {
          batchId,
          studentId,
        },
      },
    });
  }

  // ==========================================
  // STUDY MATERIALS
  // ==========================================
  static async listStudyMaterials(filter: { branchId?: string; courseId?: string; batchId?: string }) {
    const where: any = {};
    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.courseId) where.courseId = filter.courseId;
    if (filter.batchId) where.batchId = filter.batchId;

    return prisma.studyMaterial.findMany({
      where,
      include: {
        course: { select: { name: true, code: true } },
        batch: { select: { name: true } },
        uploader: { select: { id: true, fullName: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createStudyMaterial(uploaderId: string, input: CreateStudyMaterialInput) {
    return prisma.studyMaterial.create({
      data: {
        uploaderId,
        title: input.title,
        description: input.description,
        fileUrl: input.fileUrl,
        fileType: input.fileType || "pdf",
        fileSize: input.fileSize,
        courseId: input.courseId || null,
        batchId: input.batchId || null,
        branchId: input.branchId || null,
        isPublic: input.isPublic ?? false,
      },
      include: {
        course: { select: { name: true } },
        batch: { select: { name: true } },
        uploader: { select: { fullName: true } },
      },
    });
  }

  static async deleteStudyMaterial(id: string, operator: JwtUserPayload) {
    const item = await prisma.studyMaterial.findUnique({ where: { id } });
    if (!item) throw new NotFoundError("Study material not found");

    if (operator.role !== UserRole.SUPER_ADMIN) {
      if (operator.role === UserRole.TEACHER) {
        if (item.uploaderId !== operator.userId) {
          throw new ForbiddenError("You can only delete study materials you uploaded personally.");
        }
      } else if (operator.role === UserRole.BRANCH_ADMIN) {
        if (!item.branchId || item.branchId !== operator.branchId) {
          throw new ForbiddenError("You do not have permission to delete study materials from other branches.");
        }
      } else {
        throw new ForbiddenError("You do not have permission to delete this study material.");
      }
    }

    return prisma.studyMaterial.delete({ where: { id } });
  }


  static async getStudentMaterials(studentUserId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: studentUserId },
      include: {
        enrollments: { select: { batchId: true, batch: { select: { courseId: true } } } },
      },
    });
    if (!profile) return [];

    const enrolledBatchIds = profile.enrollments.map((e) => e.batchId);
    const enrolledCourseIds = profile.enrollments.map((e) => e.batch.courseId).filter(Boolean) as string[];

    return prisma.studyMaterial.findMany({
      where: {
        OR: [
          { isPublic: true },
          { batchId: { in: enrolledBatchIds } },
          { courseId: { in: enrolledCourseIds } },
        ],
      },
      include: {
        batch: { select: { name: true } },
        course: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
