import { describe, it, expect, vi, beforeEach } from "vitest";
import { TeacherService } from "./teacher.service.js";
import { prisma } from "../../config/prisma.js";
import { ForbiddenError } from "../../common/errors/appError.js";

vi.mock("../../config/prisma.js", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    teacherProfile: { findUnique: vi.fn(), update: vi.fn() },
    batch: { findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    exam: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    examResult: { upsert: vi.fn() },
  },
}));

describe("TeacherService Authorization & Scoping Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTeacher = {
    id: "user-teacher-1",
    fullName: "Dr. Ahmed Sakil",
    branchId: "branch-main",
    teacherProfile: {
      id: "profile-teacher-1",
    },
  };

  const mockBatch = {
    id: "batch-1",
    name: "HSC 2026 Academic Batch",
    teacherId: "profile-lead-other",
    subjects: ["Higher Mathematics", "Physics", "Chemistry"],
    subjectTeachers: [
      {
        subject: "Higher Mathematics",
        teacherId: "profile-teacher-1",
        teacherUserId: "user-teacher-1",
        teacherName: "Dr. Ahmed Sakil",
      },
      {
        subject: "Physics",
        teacherId: "profile-teacher-2",
        teacherUserId: "user-teacher-2",
        teacherName: "Prof. Farhan",
      },
    ],
    classModules: [
      {
        classNumber: 1,
        title: "Calculus & Limits",
        subject: "Higher Mathematics",
        teacherId: "profile-teacher-1",
        teacherName: "Dr. Ahmed Sakil",
      },
      {
        classNumber: 2,
        title: "Thermodynamics",
        subject: "Physics",
        teacherId: "profile-teacher-2",
        teacherName: "Prof. Farhan",
      },
    ],
    routine: [
      {
        day: "SAT",
        startTime: "10:00 AM",
        subject: "Higher Mathematics",
        teacherName: "Dr. Ahmed Sakil",
      },
    ],
  };

  describe("getTeacherAssignedSubjects", () => {
    it("returns only the subjects explicitly mapped to the teacher", () => {
      const subjects = TeacherService.getTeacherAssignedSubjects(mockBatch, mockTeacher);
      expect(subjects).toEqual(["Higher Mathematics"]);
      expect(subjects).not.toContain("Physics");
      expect(subjects).not.toContain("Chemistry");
    });

    it("returns all subjects if teacher is sole lead mentor and no other subject teachers exist", () => {
      const leadBatch = {
        id: "batch-lead",
        teacherId: "profile-teacher-1",
        subjects: ["Higher Mathematics", "Physics"],
        subjectTeachers: [],
      };
      const subjects = TeacherService.getTeacherAssignedSubjects(leadBatch, mockTeacher);
      expect(subjects).toEqual(["Higher Mathematics", "Physics"]);
    });
  });

  describe("isExamAssignedToTeacher", () => {
    it("allows teacher to access exams for their assigned subject", () => {
      const mathExam = {
        id: "exam-math-1",
        batchId: "batch-1",
        subject: "Higher Mathematics",
        title: "Calculus Midterm",
      };
      expect(TeacherService.isExamAssignedToTeacher(mathExam, mockBatch, mockTeacher)).toBe(true);
    });

    it("strictly blocks teacher from accessing or modifying another teacher's subject exam", () => {
      const physicsExam = {
        id: "exam-physics-1",
        batchId: "batch-1",
        subject: "Physics",
        title: "Thermodynamics Quiz",
      };
      expect(TeacherService.isExamAssignedToTeacher(physicsExam, mockBatch, mockTeacher)).toBe(false);
    });
  });

  describe("isClassModuleAssignedToTeacher", () => {
    it("identifies modules taught by the teacher", () => {
      const mathModule = mockBatch.classModules[0];
      expect(TeacherService.isClassModuleAssignedToTeacher(mathModule, mockBatch, mockTeacher)).toBe(true);
    });

    it("identifies modules taught by another teacher as not mine", () => {
      const physicsModule = mockBatch.classModules[1];
      expect(TeacherService.isClassModuleAssignedToTeacher(physicsModule, mockBatch, mockTeacher)).toBe(false);
    });
  });

  describe("updateBatchRoutine restrictions", () => {
    it("throws ForbiddenError if teacher attempts to modify routine timetable", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockTeacher as any);
      vi.mocked(prisma.teacherProfile.findUnique).mockResolvedValue(mockTeacher.teacherProfile as any);
      vi.mocked(prisma.batch.findUnique).mockResolvedValue(mockBatch as any);

      await expect(
        TeacherService.updateBatchRoutine(mockTeacher.id, mockBatch.id, {
          routine: [
            {
              day: "SUN",
              startTime: "12:00 PM",
              endTime: "01:30 PM",
              subject: "Higher Mathematics",
              teacherName: "Dr. Ahmed Sakil",
              classroom: "Room 102",
              topic: "Matrices",
            },
          ],
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it("throws ForbiddenError if teacher attempts to modify or delete another instructor's class module", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockTeacher as any);
      vi.mocked(prisma.teacherProfile.findUnique).mockResolvedValue(mockTeacher.teacherProfile as any);
      vi.mocked(prisma.batch.findUnique).mockResolvedValue(mockBatch as any);

      // Attempting to remove the Physics module
      await expect(
        TeacherService.updateBatchRoutine(mockTeacher.id, mockBatch.id, {
          routine: mockBatch.routine as any,
          classModules: [mockBatch.classModules[0]], // Physics module removed!
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
