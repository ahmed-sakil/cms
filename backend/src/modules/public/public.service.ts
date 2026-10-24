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

    const [courses, batchesList, notices, branches, organization, achievements, testimonials, exams, facultyTipsList, teachersList] = await Promise.all([
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
          faviconUrl: true,
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
      prisma.facultyTip.findMany({
        where: { isPublished: true },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      }),
      prisma.user.findMany({
        where: {
          role: "TEACHER",
          isActive: true,
          deletedAt: null,
        },
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          branch: { select: { id: true, name: true, code: true } },
          teacherProfile: {
            select: {
              id: true,
              qualification: true,
              specialization: true,
              bio: true,
            },
          },
          teacherApplication: {
            select: {
              preferredSubject: true,
              preferredClass: true,
              bio: true,
              educationalQualifications: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 12,
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
      (b) => b.status === BatchStatus.ONGOING || b.status === BatchStatus.UPCOMING
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

    // Curated study tips and strategies from database
    const studyTips = facultyTipsList.map((t) => ({
      id: t.id,
      category: t.category,
      title: t.title,
      slug: t.slug,
      excerpt: t.excerpt,
      readTime: t.readTime,
      author: t.authorTitle ? `${t.author} (${t.authorTitle})` : t.author,
      authorName: t.author,
      authorTitle: t.authorTitle,
      authorImage: t.authorImage,
      coverImage: t.coverImage,
      content: t.content,
      viewsCount: t.viewsCount,
      createdAt: t.createdAt.toISOString(),
    }));

    const teachers = teachersList.map((t) => ({
      id: t.id,
      fullName: t.fullName,
      avatarUrl: t.avatarUrl,
      branchName: t.branch?.name || null,
      specialization:
        t.teacherProfile?.specialization ||
        t.teacherApplication?.preferredSubject ||
        "Faculty Member",
      qualification:
        t.teacherProfile?.qualification || "Distinguished Faculty",
      bio: t.teacherProfile?.bio || t.teacherApplication?.bio || "",
    }));

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
      facultyTips: studyTips,
      teachers,
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

  static async listFacultyTips(category?: string, search?: string) {
    const where: any = { isPublished: true };
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

  static async getFacultyTipById(idOrSlug: string) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idOrSlug);
    const where = isUuid ? { id: idOrSlug } : { slug: idOrSlug };
    const tip = await prisma.facultyTip.findFirst({
      where: { ...where, isPublished: true },
    });
    if (!tip) return null;

    // Increment view count asynchronously in background
    prisma.facultyTip.update({
      where: { id: tip.id },
      data: { viewsCount: { increment: 1 } },
    }).catch(() => {});

    return tip;
  }

  static async listPublicTestimonials(role?: string, rating?: number) {
    const where: any = { isApproved: true };
    if (role && role !== "ALL") {
      where.role = { equals: role, mode: "insensitive" };
    }
    if (rating && rating > 0) {
      where.rating = Number(rating);
    }
    const [testimonials, totalCount, ratingStats] = await Promise.all([
      prisma.testimonial.findMany({
        where,
        orderBy: { createdAt: "desc" },
      }),
      prisma.testimonial.count({ where: { isApproved: true } }),
      prisma.testimonial.groupBy({
        by: ["rating"],
        where: { isApproved: true },
        _count: { rating: true },
      }),
    ]);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalScore = 0;
    ratingStats.forEach((stat) => {
      distribution[stat.rating] = stat._count.rating;
      totalScore += stat.rating * stat._count.rating;
    });

    const averageRating = totalCount > 0 ? Number((totalScore / totalCount).toFixed(1)) : 5.0;

    return {
      testimonials,
      totalCount,
      averageRating,
      distribution,
    };
  }

  static async getFacultyPublicProfile(teacherIdOrUserId: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: teacherIdOrUserId, role: "TEACHER" },
          { teacherProfile: { id: teacherIdOrUserId } },
        ],
      },
      include: {
        branch: { select: { id: true, name: true, code: true, address: true, phone: true } },
        teacherProfile: {
          include: {
            batches: {
              where: { isPublic: true, deletedAt: null },
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
        teacherApplication: {
          select: {
            educationalQualifications: true,
            preferredClass: true,
            preferredSubject: true,
            bio: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      branch: user.branch,
      specialization:
        user.teacherProfile?.specialization ||
        user.teacherApplication?.preferredSubject ||
        "Faculty Instructor",
      qualification:
        user.teacherProfile?.qualification || "Distinguished Faculty",
      bio: user.teacherProfile?.bio || user.teacherApplication?.bio || "",
      educationalQualifications:
        user.teacherApplication?.educationalQualifications || [],
      batches: user.teacherProfile?.batches || [],
    };
  }

  static async listTeachers() {
    const users = await prisma.user.findMany({
      where: {
        role: "TEACHER",
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        branch: { select: { id: true, name: true, code: true } },
        teacherProfile: {
          select: {
            id: true,
            qualification: true,
            specialization: true,
            bio: true,
          },
        },
        teacherApplication: {
          select: {
            preferredSubject: true,
            preferredClass: true,
            bio: true,
            educationalQualifications: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return users.map((t) => ({
      id: t.id,
      fullName: t.fullName,
      avatarUrl: t.avatarUrl,
      branchName: t.branch?.name || null,
      specialization:
        t.teacherProfile?.specialization ||
        t.teacherApplication?.preferredSubject ||
        "Faculty Member",
      qualification:
        t.teacherProfile?.qualification || "Distinguished Faculty",
      bio: t.teacherProfile?.bio || t.teacherApplication?.bio || "",
    }));
  }
}

