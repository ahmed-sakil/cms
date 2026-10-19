import { PrismaClient, UserRole, Gender, BatchStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create or Find Institution
  const institution = await prisma.institution.upsert({
    where: { code: "APEX-ORG" },
    update: {
      tagline: "Empowering Academic Leaders Since 2012",
      establishedYear: "2018",
      whatsappNumber: "+880 1711-111111",
      paymentChannels: [
        {
          id: "pc-1",
          provider: "BKASH",
          accountType: "MERCHANT",
          accountNumber: "01700-112233",
          instructions: "Select 'Payment' option on bKash App, enter your Student Roll Number as Reference.",
          isActive: true,
        },
        {
          id: "pc-2",
          provider: "BKASH",
          accountType: "PERSONAL",
          accountNumber: "01711-223344",
          instructions: "Send Money with Student Roll Number in Counter/Reference.",
          isActive: true,
        },
        {
          id: "pc-3",
          provider: "NAGAD",
          accountType: "MERCHANT",
          accountNumber: "01800-334455",
          instructions: "Select 'Merchant Pay' on Nagad App, enter Student Roll as Reference.",
          isActive: true,
        },
        {
          id: "pc-4",
          provider: "ROCKET",
          accountType: "PERSONAL",
          accountNumber: "01900-556677-2",
          instructions: "Send Money using student phone number as note.",
          isActive: true,
        },
      ],
    },
    create: {
      name: "Apex Coaching Institute",
      code: "APEX-ORG",
      tagline: "Empowering Academic Leaders Since 2012",
      establishedYear: "2018",
      whatsappNumber: "+880 1711-111111",
      website: "https://apexcoaching.com",
      email: "info@apexcoaching.com",
      phone: "+880 1700-000000",
      address: "House 42, Road 7/A, Dhanmondi, Dhaka",
      paymentChannels: [
        {
          id: "pc-1",
          provider: "BKASH",
          accountType: "MERCHANT",
          accountNumber: "01700-112233",
          instructions: "Select 'Payment' option on bKash App, enter your Student Roll Number as Reference.",
          isActive: true,
        },
        {
          id: "pc-2",
          provider: "BKASH",
          accountType: "PERSONAL",
          accountNumber: "01711-223344",
          instructions: "Send Money with Student Roll Number in Counter/Reference.",
          isActive: true,
        },
        {
          id: "pc-3",
          provider: "NAGAD",
          accountType: "MERCHANT",
          accountNumber: "01800-334455",
          instructions: "Select 'Merchant Pay' on Nagad App, enter Student Roll as Reference.",
          isActive: true,
        },
        {
          id: "pc-4",
          provider: "ROCKET",
          accountType: "PERSONAL",
          accountNumber: "01900-556677-2",
          instructions: "Send Money using student phone number as note.",
          isActive: true,
        },
      ],
    },
  });

  // 2. Create Branches
  const branchDhanmondi = await prisma.branch.upsert({
    where: { code: "DH-01" },
    update: {
      isMainBranch: true,
      establishedYear: "2018",
      whatsappNumber: "+880 1711-111111",
      description: "Central Academic Complex featuring air-conditioned classrooms, full-scale physics and chemistry labs, and centralized admissions desk.",
    },
    create: {
      institutionId: institution.id,
      name: "Dhanmondi Campus",
      code: "DH-01",
      address: "House 42, Road 7/A, Dhanmondi, Dhaka",
      phone: "+880 1711-111111",
      email: "dhanmondi@apexcoaching.com",
      whatsappNumber: "+880 1711-111111",
      establishedYear: "2018",
      description: "Central Academic Complex featuring air-conditioned classrooms, full-scale physics and chemistry labs, and centralized admissions desk.",
      isMainBranch: true,
    },
  });

  const branchUttara = await prisma.branch.upsert({
    where: { code: "UT-02" },
    update: {
      isMainBranch: false,
      establishedYear: "2021",
      whatsappNumber: "+880 1722-222222",
      description: "North Dhaka branch with modern study auditoriums and interactive digital classrooms.",
    },
    create: {
      institutionId: institution.id,
      name: "Uttara Campus",
      code: "UT-02",
      address: "Sector 4, Road 12, Uttara, Dhaka",
      phone: "+880 1722-222222",
      email: "uttara@apexcoaching.com",
      whatsappNumber: "+880 1722-222222",
      establishedYear: "2021",
      description: "North Dhaka branch with modern study auditoriums and interactive digital classrooms.",
      isMainBranch: false,
    },
  });

  const branchMirpur = await prisma.branch.upsert({
    where: { code: "MP-03" },
    update: {
      isMainBranch: false,
      establishedYear: "2023",
      whatsappNumber: "+880 1733-333333",
      description: "Conveniently situated opposite Mirpur-10 metro station, equipped with quiet study reading rooms.",
    },
    create: {
      institutionId: institution.id,
      name: "Mirpur Campus",
      code: "MP-03",
      address: "Plot 18, Block B, Mirpur-10, Dhaka",
      phone: "+880 1733-333333",
      email: "mirpur@apexcoaching.com",
      whatsappNumber: "+880 1733-333333",
      establishedYear: "2023",
      description: "Conveniently situated opposite Mirpur-10 metro station, equipped with quiet study reading rooms.",
      isMainBranch: false,
    },
  });

  // 3. Create Super Admin User
  const defaultPasswordHash = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "admin@apexcoaching.com" },
    update: {},
    create: {
      institutionId: institution.id,
      email: "admin@apexcoaching.com",
      fullName: "System Super Admin",
      phone: "+880 1700-000001",
      passwordHash: defaultPasswordHash,
      role: UserRole.SUPER_ADMIN,
      adminProfile: {
        create: {
          designation: "Executive Director",
        },
      },
    },
  });

  // 4. Create Teacher User
  const teacherUser = await prisma.user.upsert({
    where: { email: "teacher@apexcoaching.com" },
    update: {},
    create: {
      institutionId: institution.id,
      branchId: branchDhanmondi.id,
      email: "teacher@apexcoaching.com",
      fullName: "Prof. Mahmudul Hasan",
      phone: "+880 1711-998877",
      passwordHash: defaultPasswordHash,
      role: UserRole.TEACHER,
      teacherProfile: {
        create: {
          qualification: "M.Sc in Applied Mathematics, BUET",
          specialization: "Higher Mathematics & Calculus",
          bio: "Senior faculty with 12+ years of HSC and admission coaching experience.",
        },
      },
    },
    include: { teacherProfile: true },
  });

  // 5. Create Staff Users (Manager and Director)
  const staffManager = await prisma.user.upsert({
    where: { email: "staff@apexcoaching.com" },
    update: {},
    create: {
      institutionId: institution.id,
      branchId: branchDhanmondi.id,
      email: "staff@apexcoaching.com",
      fullName: "Rashidul Karim",
      phone: "+880 1722-778899",
      passwordHash: defaultPasswordHash,
      role: UserRole.STAFF,
      staffProfile: {
        create: {
          designation: "Branch Manager",
          department: "Campus Administration",
        },
      },
    },
  });

  const staffDirector = await prisma.user.upsert({
    where: { email: "director@apexcoaching.com" },
    update: {},
    create: {
      institutionId: institution.id,
      branchId: branchDhanmondi.id,
      email: "director@apexcoaching.com",
      fullName: "Engr. Mahbubur Rahman",
      phone: "+880 1711-445566",
      passwordHash: defaultPasswordHash,
      role: UserRole.STAFF,
      staffProfile: {
        create: {
          designation: "Campus Director",
          department: "Academic Operations",
        },
      },
    },
  });

  // Assign Director & Manager to Dhanmondi Campus
  await prisma.branch.update({
    where: { id: branchDhanmondi.id },
    data: {
      directorId: staffDirector.id,
      managerId: staffManager.id,
    },
  });

  // 6. Create Student User
  const studentUser = await prisma.user.upsert({
    where: { email: "student@apexcoaching.com" },
    update: {},
    create: {
      institutionId: institution.id,
      branchId: branchDhanmondi.id,
      email: "student@apexcoaching.com",
      fullName: "Tanvir Ahmed",
      phone: "+880 1700-000002",
      passwordHash: defaultPasswordHash,
      role: UserRole.STUDENT,
      studentProfile: {
        create: {
          rollNumber: "2026-DH-0101",
          gender: Gender.MALE,
          guardianName: "Rafiqul Islam",
          guardianPhone: "+880 1800-000001",
          bloodGroup: "B+",
          address: "Dhanmondi, Dhaka",
        },
      },
    },
  });

  // 7. Seed Academic Classes
  const classHSC1 = await prisma.academicClass.upsert({
    where: { code: "HSC-1ST-26" },
    update: {},
    create: {
      name: "HSC 1st Year (2026-2027)",
      code: "HSC-1ST-26",
      academicYear: "2026",
      category: "COLLEGE",
      displayOrder: 1,
    },
  });

  const classHSC2 = await prisma.academicClass.upsert({
    where: { code: "HSC-2ND-26" },
    update: {},
    create: {
      name: "HSC 2nd Year (2025-2026)",
      code: "HSC-2ND-26",
      academicYear: "2026",
      category: "COLLEGE",
      displayOrder: 2,
    },
  });

  const classBUET = await prisma.academicClass.upsert({
    where: { code: "ADM-BUET-26" },
    update: {},
    create: {
      name: "BUET & Engineering Admission 2026",
      code: "ADM-BUET-26",
      academicYear: "2026",
      category: "ADMISSION",
      displayOrder: 3,
    },
  });

  const classMedical = await prisma.academicClass.upsert({
    where: { code: "ADM-MED-26" },
    update: {},
    create: {
      name: "Medical College Admission 2026",
      code: "ADM-MED-26",
      academicYear: "2026",
      category: "ADMISSION",
      displayOrder: 4,
    },
  });

  const classDU = await prisma.academicClass.upsert({
    where: { code: "ADM-DU-KA-26" },
    update: {},
    create: {
      name: "Dhaka University 'Ka' Unit Admission 2026",
      code: "ADM-DU-KA-26",
      academicYear: "2026",
      category: "ADMISSION",
      displayOrder: 5,
    },
  });

  const classSSC = await prisma.academicClass.upsert({
    where: { code: "SSC-CLS10-26" },
    update: {},
    create: {
      name: "Class 10 / SSC 2026",
      code: "SSC-CLS10-26",
      academicYear: "2026",
      category: "SCHOOL",
      displayOrder: 6,
    },
  });

  // 8. Create Online / Core Courses
  const courseMath = await prisma.course.upsert({
    where: { branchId_code: { branchId: branchDhanmondi.id, code: "MATH-HSC" } },
    update: {},
    create: {
      branchId: branchDhanmondi.id,
      name: "Higher Mathematics - Calculus & Algebra",
      code: "MATH-HSC",
      durationWeeks: 20,
      feeAmount: 15000.0,
      description: "Comprehensive problem solving and test series for board and admission prep.",
      isPublic: true,
      isPublished: true,
    },
  });

  // 9. Create Offline Batches with detailed specifications
  const batch1 = await prisma.batch.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {
      academicClassId: classHSC1.id,
      title: "HSC 2026 Higher Mathematics Academic & Board Prep Batch",
      coverImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80",
      seatLimit: 40,
      maxCapacity: 40,
      totalClasses: 36,
      totalExams: 12,
      classesPerWeek: 3,
      daysOfWeek: ["SUN", "TUE", "THU"],
      classTime: "8:30 AM - 10:30 AM",
      scheduleTime: "Sun, Tue, Thu (8:30 AM - 10:30 AM)",
      classroom: "Room 301, Dhanmondi Campus",
      feeAmount: 6000.0,
      feeType: "ONE_TIME",
      subjects: ["Higher Mathematics 1st Paper", "Higher Mathematics 2nd Paper"],
      subjectTeachers: [
        { subject: "Higher Math 1st Paper", teacherName: "Prof. Mahmud Hasan", teacherRole: "Senior Faculty" },
        { subject: "Higher Math 2nd Paper", teacherName: "Engr. Zillur Rahman", teacherRole: "BUET Alumnus" },
      ],
      classModules: [
        { week: 1, topic: "Matrix & Determinants: Inverse Matrix & Cramer's Rule", classes: 3 },
        { week: 2, topic: "Vectors in 3D Space: Dot & Cross Product Mechanics", classes: 3 },
        { week: 3, topic: "Straight Lines: Slope, Angle between Lines & Distance Formulas", classes: 3 },
        { week: 4, topic: "Circles: Tangent equations and Normal vectors", classes: 3 },
        { week: 5, topic: "Limits & Differentiation: First Principle and Chain Rule", classes: 3 },
        { week: 6, topic: "Integration by Substitution and Partial Fractions", classes: 3 },
      ],
      routine: [
        { day: "Sunday", time: "8:30 AM - 10:30 AM", type: "LECTURE", topic: "Theory & Conceptual Proofs" },
        { day: "Tuesday", time: "8:30 AM - 10:30 AM", type: "PROBLEM_SOLVING", topic: "Board Question & CQ Practice" },
        { day: "Thursday", time: "8:30 AM - 10:30 AM", type: "EXAM", topic: "Weekly 50-mark Evaluation Test" },
      ],
      isPublic: true,
      status: BatchStatus.UPCOMING,
    },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      branchId: branchDhanmondi.id,
      courseId: courseMath.id,
      academicClassId: classHSC1.id,
      teacherId: teacherUser.teacherProfile?.id,
      name: "Batch Alpha - Higher Mathematics",
      title: "HSC 2026 Higher Mathematics Academic & Board Prep Batch",
      coverImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80",
      startDate: new Date("2026-11-01"),
      scheduleTime: "Sun, Tue, Thu (8:30 AM - 10:30 AM)",
      classTime: "8:30 AM - 10:30 AM",
      classroom: "Room 301, Dhanmondi Campus",
      status: BatchStatus.UPCOMING,
      seatLimit: 40,
      maxCapacity: 40,
      totalClasses: 36,
      totalExams: 12,
      classesPerWeek: 3,
      daysOfWeek: ["SUN", "TUE", "THU"],
      feeAmount: 6000.0,
      feeType: "ONE_TIME",
      subjects: ["Higher Mathematics 1st Paper", "Higher Mathematics 2nd Paper"],
      subjectTeachers: [
        { subject: "Higher Math 1st Paper", teacherName: "Prof. Mahmud Hasan", teacherRole: "Senior Faculty" },
      ],
      classModules: [
        { week: 1, topic: "Matrix & Determinants: Inverse Matrix & Cramer's Rule", classes: 3 },
        { week: 2, topic: "Vectors in 3D Space: Dot & Cross Product Mechanics", classes: 3 },
      ],
      routine: [
        { day: "Sunday", time: "8:30 AM - 10:30 AM", type: "LECTURE", topic: "Theory & Conceptual Proofs" },
        { day: "Tuesday", time: "8:30 AM - 10:30 AM", type: "PROBLEM_SOLVING", topic: "Board Question & CQ Practice" },
        { day: "Thursday", time: "8:30 AM - 10:30 AM", type: "EXAM", topic: "Weekly 50-mark Evaluation Test" },
      ],
      isPublic: true,
    },
  });

  const batch2 = await prisma.batch.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {
      academicClassId: classBUET.id,
      title: "BUET 2026 Engineering Admission Math & Physics Special Batch",
      coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      seatLimit: 35,
      maxCapacity: 35,
      totalClasses: 48,
      totalExams: 24,
      classesPerWeek: 4,
      daysOfWeek: ["FRI", "SAT", "MON", "WED"],
      classTime: "4:00 PM - 6:30 PM",
      scheduleTime: "Fri, Sat, Mon, Wed (4:00 PM - 6:30 PM)",
      classroom: "Auditorium Hall, Dhanmondi Campus",
      feeAmount: 18000.0,
      feeType: "INSTALLMENT",
      subjects: ["Advanced Engineering Mathematics", "Calculus & Vector Mechanics", "Applied Physics"],
      subjectTeachers: [
        { subject: "Engineering Math", teacherName: "Engr. Tanvir Ahmed (BUET)", teacherRole: "Lead Mentor" },
      ],
      classModules: [
        { week: 1, topic: "Advanced Vectors & Rotational Dynamics", classes: 4 },
        { week: 2, topic: "Complex Numbers & Polynomial Factorization in Engineering", classes: 4 },
      ],
      routine: [
        { day: "Friday", time: "4:00 PM - 6:30 PM", type: "EXAM", topic: "Central Engineering Model Test (100 Marks)" },
        { day: "Saturday", time: "4:00 PM - 6:30 PM", type: "LECTURE", topic: "Test Solution & Advanced Concepts" },
      ],
      isPublic: true,
      status: BatchStatus.UPCOMING,
    },
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      branchId: branchDhanmondi.id,
      courseId: courseMath.id,
      academicClassId: classBUET.id,
      teacherId: teacherUser.teacherProfile?.id,
      name: "Batch Omega - Engineering Admission",
      title: "BUET 2026 Engineering Admission Math & Physics Special Batch",
      coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      startDate: new Date("2026-11-15"),
      scheduleTime: "Fri, Sat, Mon, Wed (4:00 PM - 6:30 PM)",
      classTime: "4:00 PM - 6:30 PM",
      classroom: "Auditorium Hall, Dhanmondi Campus",
      status: BatchStatus.UPCOMING,
      seatLimit: 35,
      maxCapacity: 35,
      totalClasses: 48,
      totalExams: 24,
      classesPerWeek: 4,
      daysOfWeek: ["FRI", "SAT", "MON", "WED"],
      feeAmount: 18000.0,
      feeType: "INSTALLMENT",
      subjects: ["Advanced Engineering Mathematics", "Calculus & Vector Mechanics"],
      isPublic: true,
    },
  });

  // 9. Enroll Student in Batch
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: studentUser.id },
  });

  if (studentProfile) {
    await prisma.batchEnrollment.upsert({
      where: {
        batchId_studentId: {
          batchId: batch1.id,
          studentId: studentProfile.id,
        },
      },
      update: {},
      create: {
        batchId: batch1.id,
        studentId: studentProfile.id,
      },
    });
  }

  // 10. Create Public Notices
  await prisma.publicNotice.createMany({
    data: [
      {
        branchId: branchDhanmondi.id,
        title: "Model Test Series 2026 Registration Open",
        content: "Students from all branches can now enroll for the central model tests with digital OMR and board standard evaluation.",
        isPublic: true,
      },
      {
        branchId: branchUttara.id,
        title: "Special Academic Counseling Sessions on Friday",
        content: "Parents and students are invited for one-on-one progress discussions with senior college faculty.",
        isPublic: true,
      },
      {
        branchId: branchMirpur.id,
        title: "HSC 2026 Routine Revision & Extra Doubt Clearing Classes",
        content: "Weekly extra math and physics sessions will run every Saturday morning across all branches.",
        isPublic: true,
      },
    ],
    skipDuplicates: true,
  });

  // 11. Create Evaluated Exam & Results for Leaderboards
  const exam1 = await prisma.exam.upsert({
    where: { id: "00000000-0000-0000-0000-000000000101" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000101",
      batchId: batch1.id,
      title: "Model Test 01: Calculus & Determinants",
      subject: "Higher Mathematics",
      examType: "MOCK_TEST",
      totalMarks: 100,
      passMarks: 40,
      examDate: new Date("2026-10-10"),
    },
  });

  if (studentProfile) {
    await prisma.examResult.upsert({
      where: {
        examId_studentId: {
          examId: exam1.id,
          studentId: studentProfile.id,
        },
      },
      update: {},
      create: {
        examId: exam1.id,
        studentId: studentProfile.id,
        marksObtained: 94.5,
        grade: "A+",
        rank: 1,
        isPassed: true,
        remarks: "Outstanding conceptual mastery and step-by-step problem solving.",
      },
    });
  }

  // Create additional bright students & exam results
  const brightStudentsData = [
    {
      name: "Ayesha Siddiqua",
      email: "ayesha.student@apexcoaching.com",
      roll: "2026-DH-0102",
      marks: 91.0,
      rank: 2,
    },
    {
      name: "Nafis Fuad",
      email: "nafis.student@apexcoaching.com",
      roll: "2026-DH-0103",
      marks: 88.5,
      rank: 3,
    },
    {
      name: "Farhana Islam",
      email: "farhana.student@apexcoaching.com",
      roll: "2026-DH-0104",
      marks: 85.0,
      rank: 4,
    },
  ];

  for (const st of brightStudentsData) {
    const user = await prisma.user.upsert({
      where: { email: st.email },
      update: {},
      create: {
        institutionId: institution.id,
        email: st.email,
        fullName: st.name,
        phone: `+880 1711-${Math.floor(100000 + Math.random() * 900000)}`,
        passwordHash: defaultPasswordHash,
        role: UserRole.STUDENT,
        studentProfile: {
          create: {
            rollNumber: st.roll,
            guardianName: "Guardian of " + st.name,
            guardianPhone: "+880 1700-000000",
            institutionName: "Notre Dame College",
            currentClass: "HSC 2nd Year",
          },
        },
      },
      include: { studentProfile: true },
    });

    if (user.studentProfile) {
      await prisma.batchEnrollment.upsert({
        where: {
          batchId_studentId: {
            batchId: batch1.id,
            studentId: user.studentProfile.id,
          },
        },
        update: {},
        create: {
          batchId: batch1.id,
          studentId: user.studentProfile.id,
          status: "ACTIVE",
        },
      });

      await prisma.examResult.upsert({
        where: {
          examId_studentId: {
            examId: exam1.id,
            studentId: user.studentProfile.id,
          },
        },
        update: {},
        create: {
          examId: exam1.id,
          studentId: user.studentProfile.id,
          marksObtained: st.marks,
          grade: "A+",
          rank: st.rank,
          isPassed: true,
          remarks: "Exceptional analytical precision in numerical derivations.",
        },
      });
    }
  }

  // 12. Seed Hall of Fame Student Achievements
  await prisma.studentAchievement.deleteMany({});
  await prisma.studentAchievement.createMany({
    data: [
      {
        studentName: "Md. Tanvir Hossain",
        batchName: "BUET Engineering Admission Batch",
        achievement: "1st in Dhaka University ('Ka' Unit)",
        college: "Notre Dame College",
        year: "2025",
        isFeatured: true,
        displayOrder: 1,
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        posterUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80",
      },
      {
        studentName: "Ayesha Siddiqua",
        batchName: "BUET Engineering Master Batch",
        achievement: "BUET CSE Merit 14",
        college: "Viqarunnisa Noon College",
        year: "2025",
        isFeatured: true,
        displayOrder: 2,
        avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
        posterUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80",
      },
      {
        studentName: "Nafis Fuad",
        batchName: "Medical Admission Master Batch",
        achievement: "Dhaka Medical College (DMC) Merit 28",
        college: "Dhaka Residential Model College",
        year: "2025",
        isFeatured: true,
        displayOrder: 3,
        avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
        posterUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80",
      },
      {
        studentName: "Farhana Islam",
        batchName: "HSC Board Masterclass Batch",
        achievement: "GPA 5.0 (Dhaka Board Merit 8th)",
        college: "Rajuk Uttara Model College",
        year: "2025",
        isFeatured: true,
        displayOrder: 4,
        avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
        posterUrl: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=600&q=80",
      },
    ],
  });

  // 13. Seed Parents & Students Reviews / Advice
  await prisma.testimonial.deleteMany({});
  await prisma.testimonial.createMany({
    data: [
      {
        name: "Engr. Kazi Mokhlesur Rahman",
        role: "PARENT",
        phone: "+880 1711-***421",
        message: "The systematic classroom evaluation and physical model tests helped my son build immense confidence for both his board examinations and university admission.",
        rating: 5,
        isApproved: true,
      },
      {
        name: "Syeda Rashida Begum",
        role: "PARENT",
        phone: "+880 1819-***803",
        message: "Dedicated teacher attention and strict seat limits make this coaching standout. Teachers know every single student by name and track their weekly progress.",
        rating: 5,
        isApproved: true,
      },
      {
        name: "Tanvir Ahmed",
        role: "STUDENT",
        phone: "+880 1914-***562",
        message: "The weekly exam routines and real-time ranklists kept me on track throughout the entire HSC session. Best problem-solving sheets and mentor guidance!",
        rating: 5,
        isApproved: true,
      },
      {
        name: "Dr. A. K. Azad",
        role: "PARENT",
        phone: "+880 1722-***918",
        message: "Transparent attendance SMS alerts and instant test marks reporting made it easy for us as working parents to monitor our daughter's learning curve.",
        rating: 5,
        isApproved: true,
      },
    ],
  });

  console.log("Database seeded successfully with Organization, Payment Channels, Branches, Staff, and Teachers!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
