import { prisma } from "../../config/prisma.js";
import type { AdmissionInquiryInput } from "../../schemas/index.js";
import { BatchStatus } from "../../types/index.js";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

let landingCache: CacheEntry<any> | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export class PublicService {
  static invalidateLandingCache() {
    landingCache = null;
  }

  static async getLandingData() {
    if (landingCache && Date.now() - landingCache.timestamp < CACHE_TTL_MS) {
      return landingCache.data;
    }

    const [courses, batchesList, notices, branches, organization, achievements, testimonials, exams] = await Promise.all([
      prisma.course.findMany({
        where: {
          isPublic: true,
          isPublished: true,
          deletedAt: null,
        },
        include: {
          branch: { select: { id: true, name: true, code: true } },
        },
        take: 6,
        orderBy: { createdAt: "desc" },
      }),
      prisma.batch.findMany({
        where: {
          isPublic: true,
          deletedAt: null,
          status: { in: [BatchStatus.UPCOMING, BatchStatus.ONGOING] },
        },
        include: {
          academicClass: { select: { id: true, name: true, code: true } },
          course: { select: { name: true, code: true, feeAmount: true } },
          branch: { select: { id: true, name: true, code: true, address: true, phone: true } },
          enrollments: {
            where: { status: "ACTIVE" },
            select: { id: true },
          },
        },
        orderBy: { startDate: "asc" },
      }),
      prisma.publicNotice.findMany({
        where: {
          isPublic: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: {
          branch: { select: { name: true } },
        },
        orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
      }),
      prisma.branch.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          code: true,
          address: true,
          phone: true,
          email: true,
          whatsappNumber: true,
          description: true,
          establishedYear: true,
          isMainBranch: true,
          director: { select: { fullName: true } },
          manager: { select: { fullName: true } },
        },
        orderBy: [{ isMainBranch: "desc" }, { createdAt: "asc" }],
      }),
      prisma.institution.findFirst({
        select: {
          name: true,
          tagline: true,
          logoUrl: true,
          phone: true,
          email: true,
          address: true,
          establishedYear: true,
          whatsappNumber: true,
          paymentChannels: true,
          posters: true,
        },
      }),
      prisma.studentAchievement.findMany({
        where: { isFeatured: true },
        orderBy: { displayOrder: "asc" },
      }),
      prisma.testimonial.findMany({
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.exam.findMany({
        where: {
          results: { some: {} },
        },
        include: {
          batch: {
            select: {
              id: true,
              name: true,
              title: true,
              academicClass: { select: { name: true } },
              branch: { select: { name: true } },
            },
          },
          results: {
            select: {
              id: true,
              marksObtained: true,
              grade: true,
              rank: true,
              student: {
                select: {
                  user: { select: { fullName: true, avatarUrl: true } },
                },
              },
            },
            orderBy: [{ rank: "asc" }, { marksObtained: "desc" }],
            take: 10,
          },
        },
        orderBy: { examDate: "desc" },
        take: 8,
      }),
    ]);

    const formattedBatches = batchesList.map((b) => {
      const confirmed = b.enrollments.length;
      const seatLimit = b.seatLimit || b.maxCapacity || 40;
      return {
        id: b.id,
        name: b.name,
        title: b.title || b.name,
        coverImage: b.coverImage,
        startDate: b.startDate.toISOString().split("T")[0],
        scheduleTime: b.scheduleTime || b.classTime,
        classTime: b.classTime || b.scheduleTime,
        classroom: b.classroom,
        seatLimit,
        enrolledCount: confirmed,
        availableSeats: Math.max(0, seatLimit - confirmed),
        isHouseFull: confirmed >= seatLimit,
        feeAmount: Number(b.feeAmount),
        feeType: b.feeType,
        totalClasses: b.totalClasses,
        totalExams: b.totalExams,
        classesPerWeek: b.classesPerWeek,
        daysOfWeek: b.daysOfWeek || [],
        status: b.status,
        academicClass: b.academicClass,
        branch: b.branch,
        course: b.course,
      };
    });

    const availableBatches = formattedBatches.filter(
      (b) => b.status === BatchStatus.ONGOING || (b.status === BatchStatus.UPCOMING && !b.isHouseFull)
    );
    const upcomingBatches = formattedBatches.filter((b) => b.status === BatchStatus.UPCOMING);

    const evaluatedExams = exams.map((exam) => ({
      id: exam.id,
      title: exam.title,
      subject: exam.subject || "General",
      examDate: exam.examDate.toISOString().split("T")[0],
      totalMarks: Number(exam.totalMarks),
      passMarks: Number(exam.passMarks),
      batchId: exam.batchId,
      batchName: exam.batch.name,
      batchTitle: exam.batch.title || exam.batch.name,
      academicClass: exam.batch.academicClass?.name || "Academic",
      branchName: exam.batch.branch?.name || "Main Campus",
      standings: exam.results.map((r, index) => ({
        standing: r.rank || index + 1,
        studentName: r.student.user.fullName,
        marksObtained: Number(r.marksObtained),
        totalMarks: Number(exam.totalMarks),
        percentage: Math.round((Number(r.marksObtained) / Number(exam.totalMarks)) * 100),
        grade: r.grade || (Number(r.marksObtained) >= 80 ? "A+" : Number(r.marksObtained) >= 70 ? "A" : "B"),
        avatarUrl: r.student.user.avatarUrl,
      })),
    }));

    // Curated study tips and strategies
    const studyTips = [
      {
        id: "tip-1",
        category: "Mathematics",
        title: "Calculus & Vector Problem Solving Mastery for Board & Admission",
        excerpt: "Master standard integration techniques, limit shortcuts, and 3D vector scalar products with proven step-by-step methods.",
        readTime: "4 min read",
        author: "Prof. Mahmud Hasan (Math Faculty)",
        content: "1. Prioritize standard substitution methods in indefinite integrals.\n2. In vectors, memorize the cross-product normal unit vector formula to solve spatial area questions under 60 seconds.\n3. Keep a formula notebook updated daily and practice 5 board CQ questions every evening.",
      },
      {
        id: "tip-2",
        category: "Physics",
        title: "Conquering Mechanics & Electromagnetism: The 90-Second Rule",
        excerpt: "How top engineering aspirants break down complex friction, rotational kinematics, and capacitor circuit diagrams.",
        readTime: "5 min read",
        author: "Engr. Tanvir Ahmed (BUET)",
        content: "1. Always draw a free-body diagram (FBD) before writing equilibrium equations.\n2. In electrostatics, calculate electric field using symmetry whenever Gauss's law is applicable.\n3. Solve past BUET and Dhaka University problem sets under timed exam conditions.",
      },
      {
        id: "tip-3",
        category: "Exam Strategy",
        title: "Time Management in 100-Mark Model Tests: The 3-Pass Technique",
        excerpt: "Prevent exam hall panic and ensure you never leave high-scoring questions untouched on the answer script.",
        readTime: "3 min read",
        author: "Academic Advisory Panel",
        content: "Pass 1: Solve direct recall and easy 1-step questions in the first 30 minutes.\nPass 2: Tackle standard analytical questions with clear working.\nPass 3: Dedicate the final 25 minutes to difficult derivation and proof questions, leaving 5 minutes for rechecking.",
      },
    ];

    const payload = {
      courses,
      availableBatches,
      upcomingBatches,
      notices,
      branches,
      organization,
      achievements,
      testimonials,
      evaluatedExams,
      studyTips,
    };

    landingCache = {
      data: payload,
      timestamp: Date.now(),
    };

    return payload;
  }

  static async getPublicExamResults(batchId?: string) {
    const where: any = {
      results: { some: {} },
    };
    if (batchId && batchId !== "ALL") {
      where.batchId = batchId;
    }

    const exams = await prisma.exam.findMany({
      where,
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            title: true,
            academicClass: { select: { name: true } },
            branch: { select: { name: true } },
          },
        },
        results: {
          select: {
            id: true,
            marksObtained: true,
            grade: true,
            rank: true,
            student: {
              select: {
                user: { select: { fullName: true, avatarUrl: true } },
              },
            },
          },
          orderBy: [{ rank: "asc" }, { marksObtained: "desc" }],
          take: 15,
        },
      },
      orderBy: { examDate: "desc" },
      take: 10,
    });

    return exams.map((exam) => ({
      id: exam.id,
      title: exam.title,
      subject: exam.subject || "General",
      examDate: exam.examDate.toISOString().split("T")[0],
      totalMarks: Number(exam.totalMarks),
      passMarks: Number(exam.passMarks),
      batchId: exam.batchId,
      batchName: exam.batch.name,
      batchTitle: exam.batch.title || exam.batch.name,
      academicClass: exam.batch.academicClass?.name || "Academic",
      branchName: exam.batch.branch?.name || "Main Campus",
      standings: exam.results.map((r, index) => ({
        standing: r.rank || index + 1,
        studentName: r.student.user.fullName,
        marksObtained: Number(r.marksObtained),
        totalMarks: Number(exam.totalMarks),
        percentage: Math.round((Number(r.marksObtained) / Number(exam.totalMarks)) * 100),
        grade: r.grade || (Number(r.marksObtained) >= 80 ? "A+" : Number(r.marksObtained) >= 70 ? "A" : "B"),
        avatarUrl: r.student.user.avatarUrl,
      })),
    }));
  }

  static async submitReview(input: {
    name: string;
    phone?: string;
    role?: string;
    message: string;
    rating: number;
  }) {
    return prisma.testimonial.create({
      data: {
        name: input.name,
        phone: input.phone || null,
        role: input.role || "STUDENT",
        message: input.message,
        rating: Math.min(5, Math.max(1, input.rating || 5)),
        isApproved: false,
      },
    });

  }

  static async submitInquiry(input: AdmissionInquiryInput) {
    return prisma.admissionInquiry.create({
      data: {
        studentName: input.studentName,
        email: input.email,
        phone: input.phone,
        interestedCourseId: input.interestedCourseId,
        branchId: input.preferredBranchId,
        message: input.message,
      },
    });
  }

  static async getBranches() {
    return prisma.branch.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        phone: true,
        email: true,
        whatsappNumber: true,
        description: true,
        establishedYear: true,
        isMainBranch: true,
      },
      orderBy: [{ isMainBranch: "desc" }, { name: "asc" }],
    });
  }
}
