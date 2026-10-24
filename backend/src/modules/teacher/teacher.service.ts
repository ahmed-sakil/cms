import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma.js";
import { ENV } from "../../config/env.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../common/errors/appError.js";
import { UserRole, ApplicationStatus, BatchStatus, EnrollmentStatus, AttendanceStatus } from "@prisma/client";
import { AcademicOpsService } from "../academic-ops/academic-ops.service.js";
import type {
  TeacherRegisterInput,
  TeacherApplicationInput,
  RecordTeacherAttendanceInput,
  CreateTeacherExamInput,
  SubmitTeacherExamMarksInput,
  CreateTeacherMaterialInput,
  CreateTeacherNoticeInput,
  CreateTeacherTipInput,
  UpdateTeacherRoutineInput,
} from "./teacher.schema.js";
import type { JwtUserPayload } from "../../types/index.js";

export class TeacherService {
  // ========================================================
  // 1. APPLICANT REGISTRATION & APPLICATION PIPELINE
  // ========================================================
  static async registerApplicant(input: TeacherRegisterInput) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email.toLowerCase().trim() }, { phone: input.phone.trim() }],
      },
    });

    if (existing) {
      throw new BadRequestError(
        existing.email === input.email.toLowerCase().trim()
          ? "An account with this email already exists"
          : "An account with this phone number already exists"
      );
    }

    const firstInst = await prisma.institution.findFirst({ select: { id: true } });
    if (!firstInst) throw new NotFoundError("Institution not initialized");

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        institutionId: firstInst.id,
        fullName: input.fullName.trim(),
        email: input.email.toLowerCase().trim(),
        phone: input.phone.trim(),
        passwordHash,
        role: UserRole.APPLICANT,
        isActive: true,
      },
    });

    const jwtPayload: JwtUserPayload = {
      userId: user.id,
      email: user.email,
      role: UserRole.APPLICANT as any,
      branchId: user.branchId,
      institutionId: user.institutionId,
    };

    const accessToken = jwt.sign(jwtPayload, ENV.JWT_ACCESS_SECRET, {
      expiresIn: ENV.JWT_ACCESS_EXPIRES_IN as any,
    });
    const refreshToken = jwt.sign(jwtPayload, ENV.JWT_REFRESH_SECRET, {
      expiresIn: ENV.JWT_REFRESH_EXPIRES_IN as any,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        branchId: user.branchId,
      },
    };
  }

  static async submitApplication(userId: string, input: TeacherApplicationInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { teacherApplication: true },
    });

    if (!user) throw new NotFoundError("User account not found");

    if (input.avatarUrl && input.avatarUrl !== user.avatarUrl) {
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: input.avatarUrl },
      });
    }

    const application = await prisma.teacherApplication.upsert({
      where: { userId },
      create: {
        userId,
        gender: input.gender,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        fatherName: input.fatherName,
        motherName: input.motherName,
        religion: input.religion,
        presentAddress: input.presentAddress,
        permanentAddress: input.permanentAddress,
        educationalQualifications: input.educationalQualifications,
        preferredClass: input.preferredClass,
        preferredSubject: input.preferredSubject,
        preferredBranchId: input.preferredBranchId,
        avatarUrl: input.avatarUrl,
        bio: input.bio,
        status: ApplicationStatus.PENDING,
      },
      update: {
        gender: input.gender,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        fatherName: input.fatherName,
        motherName: input.motherName,
        religion: input.religion,
        presentAddress: input.presentAddress,
        permanentAddress: input.permanentAddress,
        educationalQualifications: input.educationalQualifications,
        preferredClass: input.preferredClass,
        preferredSubject: input.preferredSubject,
        preferredBranchId: input.preferredBranchId,
        avatarUrl: input.avatarUrl,
        bio: input.bio,
        status: ApplicationStatus.PENDING,
      },
      include: {
        preferredBranch: { select: { id: true, name: true, code: true } },
      },
    });

    return application;
  }

  static async getApplicationStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        branch: { select: { id: true, name: true, code: true } },
        teacherApplication: {
          include: {
            preferredBranch: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (!user) throw new NotFoundError("User not found");
    return user;
  }

  // ========================================================
  // 2. TEACHER IDENTITY & ACCESS VERIFICATION
  // ========================================================
  static async getTeacherProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        teacherProfile: {
          include: {
            batches: {
              where: { deletedAt: null },
              select: {
                id: true,
                name: true,
                status: true,
                academicClass: { select: { name: true } },
                course: { select: { name: true } },
              },
            },
          },
        },
        teacherApplication: true,
      },
    });

    if (!user) throw new NotFoundError("Teacher account not found");
    if (user.role !== UserRole.TEACHER) {
      throw new ForbiddenError("User is not authorized as a Faculty member");
    }

    let teacherProfile = user.teacherProfile;
    if (!teacherProfile) {
      teacherProfile = await prisma.teacherProfile.create({
        data: { userId: user.id },
        include: {
          batches: {
            where: { deletedAt: null },
            select: {
              id: true,
              name: true,
              status: true,
              academicClass: { select: { name: true } },
              course: { select: { name: true } },
            },
          },
        },
      });
    }

    return {
      ...user,
      teacherProfile: teacherProfile as NonNullable<typeof user.teacherProfile>,
    };
  }

  static async assertBatchAccess(userId: string, batchId: string) {
    const teacher = await this.getTeacherProfile(userId);
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { teacher: true, course: true },
    });

    if (!batch || batch.deletedAt) {
      throw new NotFoundError("Batch not found or has been archived");
    }

    const isPrimaryTeacher = batch.teacherId === teacher.teacherProfile.id;
    let isSubjectTeacher = false;
    if (Array.isArray(batch.subjectTeachers)) {
      isSubjectTeacher = batch.subjectTeachers.some((st: any) => {
        return (
          st?.teacherId === teacher.teacherProfile.id ||
          st?.teacherId === teacher.id ||
          st?.teacherName === teacher.fullName
        );
      });
    }

    const isSameBranch = teacher.branchId && batch.branchId === teacher.branchId;

    if (!isPrimaryTeacher && !isSubjectTeacher && !isSameBranch) {
      throw new ForbiddenError("You are not assigned to manage this batch");
    }

    return { teacher, batch };
  }

  // ========================================================
  // 3. TEACHER DASHBOARD & METRICS
  // ========================================================
  static async getDashboard(userId: string) {
    const teacher = await this.getTeacherProfile(userId);
    const profileId = teacher.teacherProfile.id;

    const batches = await prisma.batch.findMany({
      where: {
        deletedAt: null,
        OR: [
          { teacherId: profileId },
          { branchId: teacher.branchId || undefined },
        ],
      },
      include: {
        course: { select: { id: true, name: true, code: true } },
        academicClass: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        _count: {
          select: {
            enrollments: { where: { status: EnrollmentStatus.ACTIVE } },
            exams: true,
            studyMaterials: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    const totalStudents = batches.reduce((acc, b) => acc + b._count.enrollments, 0);

    const now = new Date();
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const currentDay = dayNames[now.getDay()];

    const todayClasses: Array<{
      batchId: string;
      batchName: string;
      courseName: string;
      time: string;
      classroom: string;
      subject: string;
    }> = [];

    for (const b of batches) {
      const routine = Array.isArray(b.routine) ? (b.routine as any[]) : [];
      const match = routine.find(
        (slot) => slot.day === currentDay || slot.day === currentDay.toUpperCase()
      );
      if (match) {
        todayClasses.push({
          batchId: b.id,
          batchName: b.name,
          courseName: b.course?.name || "Program",
          time: match.startTime ? `${match.startTime} - ${match.endTime || ""}` : b.classTime || "Scheduled Time",
          classroom: match.classroom || b.classroom || "Main Classroom",
          subject: match.subject || "Lecture",
        });
      } else if (Array.isArray(b.daysOfWeek) && b.daysOfWeek.includes(currentDay)) {
        todayClasses.push({
          batchId: b.id,
          batchName: b.name,
          courseName: b.course?.name || "Program",
          time: b.classTime || b.scheduleTime || "Scheduled Time",
          classroom: b.classroom || "Main Classroom",
          subject: String((Array.isArray(b.subjects) && b.subjects[0]) || "General Lecture"),
        });
      }
    }

    const batchIds = batches.map((b) => b.id);
    const pendingExams = await prisma.exam.findMany({
      where: {
        batchId: { in: batchIds },
        isPublished: false,
      },
      include: {
        batch: { select: { name: true } },
        _count: { select: { results: true } },
      },
      take: 5,
      orderBy: { examDate: "desc" },
    });

    const courseIds = batches.map((b) => b.courseId).filter(Boolean) as string[];
    const recentNotices = await prisma.publicNotice.findMany({
      where: {
        OR: [
          { authorId: teacher.id },
          { isPublic: true },
          ...(teacher.branchId ? [{ branchId: teacher.branchId }] : []),
          ...(batchIds.length > 0 ? [{ batchId: { in: batchIds } }] : []),
          ...(courseIds.length > 0 ? [{ courseId: { in: courseIds } }] : []),
        ],
      },
      include: {
        batch: { select: { id: true, name: true } },
        course: { select: { id: true, name: true } },
        author: { select: { fullName: true } },
      },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
      take: 5,
    });

    return {
      teacher: {
        id: teacher.id,
        fullName: teacher.fullName,
        email: teacher.email,
        phone: teacher.phone,
        avatarUrl: teacher.avatarUrl,
        specialization: teacher.teacherProfile.specialization,
        qualification: teacher.teacherProfile.qualification,
        branch: teacher.branch,
      },
      metrics: {
        totalBatches: batches.length,
        totalStudents,
        todayClassesCount: todayClasses.length,
        pendingExamsCount: pendingExams.length,
      },
      todayClasses,
      pendingExams,
      recentNotices,
      batches: batches.slice(0, 4),
    };
  }

  // ========================================================
  // 4. BATCHES, ROSTER & TIMETABLE ROUTINE
  // ========================================================
  static async getAssignedBatches(userId: string) {
    const teacher = await this.getTeacherProfile(userId);
    const profileId = teacher.teacherProfile.id;

    return prisma.batch.findMany({
      where: {
        deletedAt: null,
        OR: [
          { teacherId: profileId },
          { branchId: teacher.branchId || undefined },
        ],
      },
      include: {
        course: { select: { id: true, name: true, code: true, durationWeeks: true } },
        academicClass: { select: { id: true, name: true, category: true } },
        branch: { select: { id: true, name: true, code: true } },
        _count: {
          select: {
            enrollments: { where: { status: EnrollmentStatus.ACTIVE } },
            exams: true,
            studyMaterials: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });
  }

  static async getBatchDetails(userId: string, batchId: string) {
    const { batch } = await this.assertBatchAccess(userId, batchId);

    const fullBatch = await prisma.batch.findUnique({
      where: { id: batch.id },
      include: {
        course: true,
        academicClass: true,
        branch: true,
        enrollments: {
          where: { status: EnrollmentStatus.ACTIVE },
          include: {
            student: {
              include: {
                user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
              },
            },
          },
          orderBy: { student: { rollNumber: "asc" } },
        },
        exams: {
          include: {
            _count: { select: { results: true } },
          },
          orderBy: { examDate: "desc" },
        },
        studyMaterials: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return fullBatch;
  }

  static async updateBatchRoutine(
    userId: string,
    batchId: string,
    input: UpdateTeacherRoutineInput
  ) {
    await this.assertBatchAccess(userId, batchId);

    return prisma.batch.update({
      where: { id: batchId },
      data: {
        routine: input.routine as any,
        classModules: input.classModules !== undefined ? (input.classModules as any) : undefined,
      },
    });
  }

  // ========================================================
  // 5. ATTENDANCE MANAGEMENT
  // ========================================================
  static async getBatchAttendance(userId: string, batchId: string, date: string) {
    const { batch } = await this.assertBatchAccess(userId, batchId);

    const parsedDate = new Date(date);
    const dateOnly = new Date(Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate()));

    const enrollments = await prisma.batchEnrollment.findMany({
      where: { batchId: batch.id, status: EnrollmentStatus.ACTIVE },
      include: {
        student: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { student: { rollNumber: "asc" } },
    });

    const existingAttendance = await prisma.attendance.findMany({
      where: {
        batchId: batch.id,
        date: dateOnly,
      },
    });

    const recordMap = new Map(existingAttendance.map((a) => [a.studentId, a]));

    const rosterWithStatus = enrollments.map((e) => {
      const att = recordMap.get(e.studentId);
      return {
        studentId: e.studentId,
        rollNumber: e.student.rollNumber,
        fullName: e.student.user.fullName,
        avatarUrl: e.student.user.avatarUrl,
        status: att?.status || AttendanceStatus.PRESENT,
        remarks: att?.remarks || "",
        isMarked: !!att,
      };
    });

    return {
      batchId: batch.id,
      batchName: batch.name,
      date: dateOnly.toISOString().split("T")[0],
      isCompleted: existingAttendance.length > 0,
      totalStudents: enrollments.length,
      presentCount: rosterWithStatus.filter((r) => r.status === AttendanceStatus.PRESENT).length,
      absentCount: rosterWithStatus.filter((r) => r.status === AttendanceStatus.ABSENT).length,
      roster: rosterWithStatus,
    };
  }

  static async recordBatchAttendance(
    userId: string,
    batchId: string,
    input: RecordTeacherAttendanceInput
  ) {
    const { teacher, batch } = await this.assertBatchAccess(userId, batchId);

    const parsedDate = new Date(input.date);
    const dateOnly = new Date(Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate()));

    const results = [];
    for (const item of input.records) {
      const record = await prisma.attendance.upsert({
        where: {
          batchId_studentId_date: {
            batchId: batch.id,
            studentId: item.studentId,
            date: dateOnly,
          },
        },
        create: {
          batchId: batch.id,
          studentId: item.studentId,
          date: dateOnly,
          status: item.status,
          remarks: item.remarks || null,
        },
        update: {
          status: item.status,
          remarks: item.remarks || null,
        },
      });
      results.push(record);
    }

    return {
      batchId: batch.id,
      batchName: batch.name,
      date: dateOnly.toISOString().split("T")[0],
      recordedCount: results.length,
    };
  }

  // ========================================================
  // 6. EXAMS & MARKSHEET EVALUATION
  // ========================================================
  static async getTeacherExams(userId: string) {
    const teacher = await this.getTeacherProfile(userId);
    const batches = await this.getAssignedBatches(userId);
    const batchIds = batches.map((b) => b.id);

    return prisma.exam.findMany({
      where: { batchId: { in: batchIds } },
      include: {
        batch: { select: { id: true, name: true, course: { select: { name: true } } } },
        _count: { select: { results: true } },
      },
      orderBy: { examDate: "desc" },
    });
  }

  static async getExamDetails(userId: string, examId: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        batch: {
          include: {
            course: true,
            enrollments: {
              where: { status: EnrollmentStatus.ACTIVE },
              include: {
                student: {
                  include: {
                    user: { select: { id: true, fullName: true, email: true, phone: true } },
                  },
                },
              },
              orderBy: { student: { rollNumber: "asc" } },
            },
          },
        },
        results: {
          include: {
            student: {
              include: {
                user: { select: { fullName: true } },
              },
            },
          },
          orderBy: { rank: "asc" },
        },
      },
    });

    if (!exam) throw new NotFoundError("Exam not found");
    await this.assertBatchAccess(userId, exam.batchId);

    return exam;
  }

  static async createExam(userId: string, input: CreateTeacherExamInput) {
    await this.assertBatchAccess(userId, input.batchId);

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
        isPublished: false,
      },
      include: {
        batch: { select: { name: true } },
      },
    });
  }

  static async submitExamMarks(
    userId: string,
    examId: string,
    input: SubmitTeacherExamMarksInput
  ) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        batch: {
          include: {
            enrollments: {
              where: { status: EnrollmentStatus.ACTIVE },
              select: { studentId: true },
            },
          },
        },
      },
    });

    if (!exam) throw new NotFoundError("Exam not found");
    await this.assertBatchAccess(userId, exam.batchId);

    const totalMarksNum = Number(exam.totalMarks);
    const passMarksNum = Number(exam.passMarks);
    const activeStudentIds = new Set(exam.batch.enrollments.map((e) => e.studentId));

    for (const score of input.scores) {
      if (score.marksObtained < 0 || score.marksObtained > totalMarksNum) {
        throw new BadRequestError(
          `Marks obtained (${score.marksObtained}) must be between 0 and total marks (${totalMarksNum})`
        );
      }
      if (!activeStudentIds.has(score.studentId)) {
        throw new BadRequestError(`Student (ID: ${score.studentId}) is not active in this batch`);
      }
    }

    const sorted = [...input.scores].sort((a, b) => b.marksObtained - a.marksObtained);

    const results = [];
    let currentRank = 1;

    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];
      if (i > 0 && item.marksObtained < sorted[i - 1].marksObtained) {
        currentRank = i + 1;
      }

      const grade = AcademicOpsService.calculateGrade(item.marksObtained, totalMarksNum);
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
        },
        update: {
          marksObtained: item.marksObtained,
          grade,
          rank: currentRank,
          isPassed,
        },
      });
      results.push(res);
    }

    if (input.publishImmediately) {
      await prisma.exam.update({
        where: { id: examId },
        data: {
          isPublished: true,
          publishedAt: new Date(),
        },
      });
    }

    return {
      examId,
      totalEvaluated: results.length,
      isPublished: input.publishImmediately ?? exam.isPublished,
      results,
    };
  }

  static async toggleExamPublish(userId: string, examId: string, isPublished: boolean) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundError("Exam not found");

    await this.assertBatchAccess(userId, exam.batchId);

    return prisma.exam.update({
      where: { id: examId },
      data: {
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
    });
  }

  // ========================================================
  // 7. STUDY MATERIALS REPOSITORY
  // ========================================================
  static async getTeacherMaterials(userId: string) {
    const teacher = await this.getTeacherProfile(userId);
    const batches = await this.getAssignedBatches(userId);
    const batchIds = batches.map((b) => b.id);

    return prisma.studyMaterial.findMany({
      where: {
        OR: [
          { uploaderId: teacher.id },
          { batchId: { in: batchIds } },
        ],
      },
      include: {
        batch: { select: { id: true, name: true } },
        course: { select: { id: true, name: true } },
        exam: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createTeacherMaterial(userId: string, input: CreateTeacherMaterialInput) {
    const { teacher, batch } = await this.assertBatchAccess(userId, input.batchId);

    return prisma.studyMaterial.create({
      data: {
        branchId: batch.branchId,
        courseId: batch.courseId,
        batchId: batch.id,
        uploaderId: teacher.id,
        title: input.title,
        description: input.description || null,
        classTopic: input.classTopic || null,
        examId: input.examId || null,
        fileUrl: input.fileUrl,
        fileType: input.fileType || "pdf",
        fileSize: input.fileSize || null,
        isPublic: false,
      },
      include: {
        batch: { select: { name: true } },
        course: { select: { name: true } },
      },
    });
  }

  // ========================================================
  // 8. TARGETED NOTICES & CIRCULARS
  // ========================================================
  static async getTeacherNotices(userId: string) {
    const teacher = await this.getTeacherProfile(userId);
    const batches = await this.getAssignedBatches(userId);
    const batchIds = batches.map((b) => b.id);
    const courseIds = batches.map((b) => b.courseId).filter(Boolean) as string[];

    return prisma.publicNotice.findMany({
      where: {
        OR: [
          { authorId: teacher.id },
          { isPublic: true },
          ...(teacher.branchId ? [{ branchId: teacher.branchId }] : []),
          ...(batchIds.length > 0 ? [{ batchId: { in: batchIds } }] : []),
          ...(courseIds.length > 0 ? [{ courseId: { in: courseIds } }] : []),
        ],
      },
      include: {
        batch: { select: { id: true, name: true } },
        course: { select: { id: true, name: true } },
        author: { select: { fullName: true } },
      },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    });
  }

  static async createTeacherNotice(userId: string, input: CreateTeacherNoticeInput) {
    const teacher = await this.getTeacherProfile(userId);

    let branchId = teacher.branchId;
    if (input.batchId) {
      const { batch } = await this.assertBatchAccess(userId, input.batchId);
      branchId = batch.branchId;
    }

    return prisma.publicNotice.create({
      data: {
        branchId: branchId || null,
        batchId: input.batchId || null,
        courseId: input.courseId || null,
        authorId: teacher.id,
        title: input.title,
        content: input.content,
        priority: input.priority || "NORMAL",
        attachmentUrl: input.attachmentUrl || null,
        isPublic: !input.batchId && !input.courseId, // private if targeted to batch or course
      },
      include: {
        batch: { select: { name: true } },
        course: { select: { name: true } },
      },
    });
  }

  // ========================================================
  // 9. FACULTY TIPS & GUIDES
  // ========================================================
  static async createTeacherTip(userId: string, input: CreateTeacherTipInput) {
    const teacher = await this.getTeacherProfile(userId);

    const baseSlug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    return prisma.facultyTip.create({
      data: {
        category: input.category,
        title: input.title,
        slug,
        excerpt: input.excerpt,
        content: input.content,
        author: teacher.fullName,
        authorTitle: teacher.teacherProfile.specialization || "Faculty Member",
        authorImage: teacher.avatarUrl || null,
        coverImage: input.coverImage || null,
        isPublished: true,
      },
    });
  }

  static async getTeacherTips() {
    return prisma.facultyTip.findMany({
      orderBy: [{ createdAt: "desc" }],
    });
  }

  // ========================================================
  // 10. PROFILE UPDATE
  // ========================================================
  static async updateProfile(
    userId: string,
    input: {
      fullName?: string;
      phone?: string;
      bio?: string;
      specialization?: string;
      qualification?: string;
      avatarUrl?: string;
      fatherName?: string;
      motherName?: string;
      dateOfBirth?: string;
      religion?: string;
      presentAddress?: string;
      permanentAddress?: string;
      educationalQualifications?: any;
    }
  ) {
    const teacher = await this.getTeacherProfile(userId);

    const userData: any = {};
    if (input.avatarUrl !== undefined) userData.avatarUrl = input.avatarUrl;
    if (input.fullName !== undefined && input.fullName.trim()) userData.fullName = input.fullName.trim();
    if (input.phone !== undefined) userData.phone = input.phone.trim();

    if (Object.keys(userData).length > 0) {
      await prisma.user.update({
        where: { id: teacher.id },
        data: userData,
      });
    }

    await prisma.teacherProfile.update({
      where: { id: teacher.teacherProfile.id },
      data: {
        bio: input.bio !== undefined ? input.bio : undefined,
        specialization: input.specialization !== undefined ? input.specialization : undefined,
        qualification: input.qualification !== undefined ? input.qualification : undefined,
      },
    });

    if (teacher.teacherApplication) {
      const appData: any = {};
      if (input.fatherName !== undefined) appData.fatherName = input.fatherName;
      if (input.motherName !== undefined) appData.motherName = input.motherName;
      if (input.presentAddress !== undefined) appData.presentAddress = input.presentAddress;
      if (input.permanentAddress !== undefined) appData.permanentAddress = input.permanentAddress;
      if (input.religion !== undefined) appData.religion = input.religion;
      if (input.dateOfBirth !== undefined) {
        appData.dateOfBirth = input.dateOfBirth ? new Date(input.dateOfBirth) : null;
      }
      if (input.educationalQualifications !== undefined) {
        appData.educationalQualifications = input.educationalQualifications;
      }
      if (input.bio !== undefined) appData.bio = input.bio;

      if (Object.keys(appData).length > 0) {
        await prisma.teacherApplication.update({
          where: { id: teacher.teacherApplication.id },
          data: appData,
        });
      }
    }

    return this.getTeacherProfile(userId);
  }
}
