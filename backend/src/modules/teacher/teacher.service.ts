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

  static isBatchAssignedToTeacher(b: any, teacher: any): boolean {
    const profileId = teacher.teacherProfile?.id;
    const teacherUserId = teacher.id;
    const teacherNameLower = (teacher.fullName || "").trim().toLowerCase();

    // 1. Direct lead teacher assignment
    if (b.teacherId && (b.teacherId === profileId || b.teacherId === teacherUserId)) return true;

    // 2. Assigned in subject teachers
    if (Array.isArray(b.subjectTeachers) && b.subjectTeachers.length > 0) {
      const match = (b.subjectTeachers as any[]).some(
        (st) =>
          st?.teacherId === profileId ||
          st?.teacherId === teacherUserId ||
          st?.teacherUserId === teacherUserId ||
          (st?.teacherName && st.teacherName.trim().toLowerCase() === teacherNameLower)
      );
      if (match) return true;
    }

    // 3. Assigned in class lectures / modules
    if (Array.isArray(b.classModules) && b.classModules.length > 0) {
      const match = (b.classModules as any[]).some(
        (cm) =>
          cm?.teacherId === profileId ||
          cm?.teacherId === teacherUserId ||
          cm?.teacherUserId === teacherUserId ||
          (cm?.teacherName && cm.teacherName.trim().toLowerCase() === teacherNameLower)
      );
      if (match) return true;
    }

    // 4. Assigned in routine slots
    if (Array.isArray(b.routine) && b.routine.length > 0) {
      const match = (b.routine as any[]).some(
        (r) =>
          r?.teacherId === profileId ||
          r?.teacherId === teacherUserId ||
          (r?.teacherName && r.teacherName.trim().toLowerCase() === teacherNameLower)
      );
      if (match) return true;
    }

    // 5. Fallback for open/unassigned batches in branch if no teacher is assigned
    if (!b.teacherId && (!b.subjectTeachers || (Array.isArray(b.subjectTeachers) && b.subjectTeachers.length === 0))) {
      if (teacher.branchId && b.branchId === teacher.branchId) return true;
    }

    return false;
  }

  static getTeacherAssignedSubjects(batch: any, teacher: any): string[] {
    const profileId = teacher.teacherProfile?.id;
    const teacherUserId = teacher.id;
    const teacherNameLower = (teacher.fullName || "").trim().toLowerCase();

    const assignedSet = new Set<string>();

    const isTeacherMatch = (tId?: string | null, tUserId?: string | null, tName?: string | null) => {
      if (tId && (tId === profileId || tId === teacherUserId)) return true;
      if (tUserId && tUserId === teacherUserId) return true;
      if (tName && tName.trim().toLowerCase() === teacherNameLower) return true;
      return false;
    };

    // 1. Check subjectTeachers
    if (Array.isArray(batch.subjectTeachers)) {
      for (const st of batch.subjectTeachers) {
        if (isTeacherMatch(st?.teacherId, st?.teacherUserId, st?.teacherName) && st?.subject) {
          assignedSet.add(st.subject.trim());
        }
      }
    }

    // 2. Check classModules
    if (Array.isArray(batch.classModules)) {
      for (const cm of batch.classModules) {
        if (isTeacherMatch(cm?.teacherId, cm?.teacherUserId, cm?.teacherName) && cm?.subject) {
          assignedSet.add(cm.subject.trim());
        }
      }
    }

    // 3. Check routine
    if (Array.isArray(batch.routine)) {
      for (const r of batch.routine) {
        if (isTeacherMatch(r?.teacherId, null, r?.teacherName) && r?.subject) {
          assignedSet.add(r.subject.trim());
        }
      }
    }

    // 4. If no subjects found specifically from mappings above, check lead mentor role
    const hasOtherSubjectTeachers = Array.isArray(batch.subjectTeachers) && batch.subjectTeachers.some(
      (st: any) => !isTeacherMatch(st?.teacherId, st?.teacherUserId, st?.teacherName) && !!st?.subject
    );

    if (assignedSet.size === 0) {
      const isLead = batch.teacherId === profileId || batch.teacherId === teacherUserId;
      if (isLead && !hasOtherSubjectTeachers) {
        if (Array.isArray(batch.subjects) && batch.subjects.length > 0) {
          for (const s of batch.subjects) {
            if (typeof s === "string" && s.trim()) assignedSet.add(s.trim());
          }
        } else if (batch.course?.name) {
          assignedSet.add(batch.course.name.trim());
        }
      } else if (isLead && hasOtherSubjectTeachers) {
        const otherSubjects = new Set(
          (batch.subjectTeachers as any[])
            .filter((st: any) => !isTeacherMatch(st?.teacherId, st?.teacherUserId, st?.teacherName) && st?.subject)
            .map((st: any) => st.subject.trim().toLowerCase())
        );
        if (Array.isArray(batch.subjects)) {
          for (const s of batch.subjects) {
            if (typeof s === "string" && s.trim() && !otherSubjects.has(s.trim().toLowerCase())) {
              assignedSet.add(s.trim());
            }
          }
        }
      }
    }

    return Array.from(assignedSet);
  }

  static isExamAssignedToTeacher(exam: any, batch: any, teacher: any): boolean {
    const teacherSubjects = this.getTeacherAssignedSubjects(batch, teacher).map((s) => s.toLowerCase());

    if (teacherSubjects.length > 0) {
      if (!exam.subject || !exam.subject.trim()) {
        return batch.teacherId === teacher.teacherProfile?.id || batch.teacherId === teacher.id;
      }
      return teacherSubjects.includes(exam.subject.trim().toLowerCase());
    }

    return false;
  }

  static isClassModuleAssignedToTeacher(cm: any, batch: any, teacher: any): boolean {
    const profileId = teacher.teacherProfile?.id;
    const teacherUserId = teacher.id;
    const teacherNameLower = (teacher.fullName || "").trim().toLowerCase();

    if (cm?.teacherId && (cm.teacherId === profileId || cm.teacherId === teacherUserId)) return true;
    if (cm?.teacherUserId && cm.teacherUserId === teacherUserId) return true;
    if (cm?.teacherName && cm.teacherName.trim().toLowerCase() === teacherNameLower) return true;

    const teacherSubjects = this.getTeacherAssignedSubjects(batch, teacher).map((s) => s.toLowerCase());
    if (cm?.subject && teacherSubjects.includes(cm.subject.trim().toLowerCase())) {
      return true;
    }

    if (!cm?.teacherId && !cm?.teacherUserId && !cm?.teacherName && !cm?.subject) {
      return batch.teacherId === profileId || batch.teacherId === teacherUserId;
    }

    return false;
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

    const hasAccess = this.isBatchAssignedToTeacher(batch, teacher);
    if (!hasAccess) {
      throw new ForbiddenError("You are not assigned to manage this batch");
    }

    return { teacher, batch };
  }

  // ========================================================
  // 3. TEACHER DASHBOARD & METRICS
  // ========================================================
  static async getDashboard(userId: string) {
    const teacher = await this.getTeacherProfile(userId);

    const candidateBatches = await prisma.batch.findMany({
      where: {
        deletedAt: null,
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

    const batches = candidateBatches.filter((b) => this.isBatchAssignedToTeacher(b, teacher));

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

    const candidateBatches = await prisma.batch.findMany({
      where: {
        deletedAt: null,
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

    return candidateBatches
      .filter((b) => this.isBatchAssignedToTeacher(b, teacher))
      .map((b) => ({
        ...b,
        teacherAssignedSubjects: this.getTeacherAssignedSubjects(b, teacher),
      }));
  }

  static async getBatchDetails(userId: string, batchId: string) {
    const { teacher, batch } = await this.assertBatchAccess(userId, batchId);

    const fullBatch = await prisma.batch.findUnique({
      where: { id: batch.id },
      include: {
        course: true,
        academicClass: true,
        branch: true,
        teacher: true,
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

    if (!fullBatch) throw new NotFoundError("Batch details not found");

    const teacherAssignedSubjects = this.getTeacherAssignedSubjects(fullBatch, teacher);
    const teacherExams = (fullBatch.exams || []).filter((ex) =>
      this.isExamAssignedToTeacher(ex, fullBatch, teacher)
    );

    const annotatedClassModules = (Array.isArray(fullBatch.classModules) ? fullBatch.classModules : []).map((cm: any) => ({
      ...cm,
      isMyModule: this.isClassModuleAssignedToTeacher(cm, fullBatch, teacher),
    }));

    return {
      ...fullBatch,
      exams: teacherExams,
      teacherAssignedSubjects,
      classModules: annotatedClassModules,
    };
  }

  static async updateBatchRoutine(
    userId: string,
    batchId: string,
    input: UpdateTeacherRoutineInput
  ) {
    const { teacher, batch } = await this.assertBatchAccess(userId, batchId);

    // 1. Strict blocking of routine alteration by teachers
    if (input.routine !== undefined && Array.isArray(input.routine)) {
      const existingRoutineStr = JSON.stringify(batch.routine || []);
      const inputRoutineStr = JSON.stringify(input.routine);
      if (existingRoutineStr !== inputRoutineStr) {
        throw new ForbiddenError(
          "Class routine schedule is set by campus administration and cannot be modified by teachers"
        );
      }
    }

    // 2. Class Modules alteration restriction:
    // Teachers can only update/complete their own assigned modules.
    let updatedClassModules = batch.classModules;
    if (input.classModules !== undefined && Array.isArray(input.classModules)) {
      const existingModules: any[] = Array.isArray(batch.classModules) ? (batch.classModules as any[]) : [];

      for (let i = 0; i < existingModules.length; i++) {
        const existingMod = existingModules[i];
        const isMine = this.isClassModuleAssignedToTeacher(existingMod, batch, teacher);
        if (!isMine) {
          const found = input.classModules.find(
            (cm: any) =>
              (cm.classNumber && cm.classNumber === existingMod.classNumber) ||
              (cm.title && cm.title === existingMod.title && cm.subject === existingMod.subject)
          );
          if (!found) {
            throw new ForbiddenError(
              "You cannot remove class lectures or modules belonging to other courses or instructors"
            );
          }
          if (
            found.title !== existingMod.title ||
            found.subject !== existingMod.subject ||
            found.teacherName !== existingMod.teacherName
          ) {
            throw new ForbiddenError(
              "You are not authorized to modify syllabus modules for other instructors' courses"
            );
          }
        }
      }

      updatedClassModules = input.classModules;
    }

    return prisma.batch.update({
      where: { id: batchId },
      data: {
        ...(updatedClassModules !== undefined && { classModules: updatedClassModules as any }),
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

    if (batchIds.length === 0) return [];

    const allExams = await prisma.exam.findMany({
      where: { batchId: { in: batchIds } },
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            teacherId: true,
            subjects: true,
            subjectTeachers: true,
            classModules: true,
            routine: true,
            course: { select: { id: true, name: true } },
          },
        },
        _count: { select: { results: true } },
      },
      orderBy: { examDate: "desc" },
    });

    return allExams.filter((exam) =>
      this.isExamAssignedToTeacher(exam, exam.batch, teacher)
    );
  }

  static async getExamDetails(userId: string, examId: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        batch: {
          include: {
            course: true,
            teacher: true,
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
    const { teacher, batch } = await this.assertBatchAccess(userId, exam.batchId);

    if (!this.isExamAssignedToTeacher(exam, exam.batch, teacher)) {
      throw new ForbiddenError(
        "You are not authorized to view or manage exams for other courses or subjects"
      );
    }

    return exam;
  }

  static async createExam(userId: string, input: CreateTeacherExamInput) {
    const { teacher, batch } = await this.assertBatchAccess(userId, input.batchId);
    const assignedSubjects = this.getTeacherAssignedSubjects(batch, teacher);

    if (assignedSubjects.length > 0) {
      if (input.subject && input.subject.trim()) {
        const allowed = assignedSubjects.some(
          (s) => s.toLowerCase() === input.subject?.trim().toLowerCase()
        );
        if (!allowed) {
          throw new ForbiddenError(
            `You can only create exams for your assigned courses (${assignedSubjects.join(", ")})`
          );
        }
      } else {
        input.subject = assignedSubjects[0];
      }
    }

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
            course: true,
            enrollments: {
              where: { status: EnrollmentStatus.ACTIVE },
              select: { studentId: true },
            },
          },
        },
      },
    });

    if (!exam) throw new NotFoundError("Exam not found");
    const { teacher, batch } = await this.assertBatchAccess(userId, exam.batchId);

    if (!this.isExamAssignedToTeacher(exam, batch, teacher)) {
      throw new ForbiddenError(
        "You are not authorized to evaluate or grade marks for other courses' exams"
      );
    }

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
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        batch: {
          include: { course: true },
        },
      },
    });
    if (!exam) throw new NotFoundError("Exam not found");

    const { teacher, batch } = await this.assertBatchAccess(userId, exam.batchId);

    if (!this.isExamAssignedToTeacher(exam, batch, teacher)) {
      throw new ForbiddenError(
        "You are not authorized to publish or modify other courses' exams"
      );
    }

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
        branch: { select: { id: true, name: true, code: true } },
        batch: { select: { id: true, name: true } },
        course: { select: { id: true, name: true } },
        author: { select: { id: true, fullName: true } },
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

  static async deleteTeacherNotice(userId: string, noticeId: string) {
    const teacher = await this.getTeacherProfile(userId);
    const existing = await prisma.publicNotice.findUnique({
      where: { id: noticeId },
    });
    if (!existing) throw new NotFoundError("Notice not found");
    if (existing.authorId !== teacher.id) {
      throw new ForbiddenError("You can only delete notices authored by you");
    }
    return prisma.publicNotice.delete({
      where: { id: noticeId },
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
