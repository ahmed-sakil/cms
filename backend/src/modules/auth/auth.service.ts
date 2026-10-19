import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma.js";
import { ENV } from "../../config/env.js";
import { UnauthorizedError, NotFoundError, BadRequestError } from "../../common/errors/appError.js";
import { UserRole, type JwtUserPayload, type AuthSessionResponse } from "../../types/index.js";
import type { LoginInput, StudentSelfRegisterInput } from "../../schemas/index.js";

export class AuthService {
  static async login(input: LoginInput): Promise<AuthSessionResponse> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const payload: JwtUserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as unknown as UserRole,
      branchId: user.branchId,
      institutionId: user.institutionId,
    };

    const accessToken = jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
      expiresIn: ENV.JWT_ACCESS_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
      expiresIn: ENV.JWT_REFRESH_EXPIRES_IN as any,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        lastLoginAt: new Date(),
      },
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role as unknown as UserRole,
        branchId: user.branchId,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  static async registerStudent(input: StudentSelfRegisterInput): Promise<AuthSessionResponse> {
    // 1. Verify branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: input.branchId },
      include: { institution: true },
    });
    if (!branch) {
      throw new NotFoundError("Selected branch not found");
    }

    // 2. Check email & phone uniqueness
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { phone: input.phone }],
      },
    });
    if (existing) {
      throw new BadRequestError(
        existing.email === input.email
          ? "This email is already registered. Please sign in instead."
          : "This phone number is already registered."
      );
    }

    // 3. Hash student's strong password
    const passwordHash = await bcrypt.hash(input.password, 10);

    // 4. Auto-generate student roll number & unique referral code
    const year = new Date().getFullYear();
    const count = await prisma.studentProfile.count({
      where: { user: { branchId: input.branchId } },
    });
    const rollNumber = `${year}-${branch.code}-${String(count + 1).padStart(4, "0")}`;
    const referralCode = `REF-${year}-${branch.code}-${String(count + 1).padStart(4, "0")}`;

    // 4b. Auto-link referring student if referral code provided
    let referredById: string | null = null;
    if (input.referredByCode?.trim()) {
      const cleanRef = input.referredByCode.trim().toUpperCase();
      const referrer = await prisma.studentProfile.findFirst({
        where: {
          OR: [
            { referralCode: cleanRef },
            { rollNumber: cleanRef },
          ],
        },
      });
      if (referrer) {
        referredById = referrer.id;
      }
    }

    // 5. Create User and StudentProfile
    const newUser = await prisma.user.create({
      data: {
        institutionId: branch.institutionId,
        branchId: branch.id,
        email: input.email,
        phone: input.phone,
        fullName: input.fullName,
        role: UserRole.STUDENT,
        passwordHash,
        studentProfile: {
          create: {
            rollNumber,
            referralCode,
            referredById,
            gender: input.gender,
            guardianName: input.guardianName,
            guardianPhone: input.guardianPhone,
            guardianType: input.guardianType || "FATHER",
            fatherName: input.fatherName || null,
            motherName: input.motherName || null,
            dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
            currentClass: input.currentClass || null,
            institutionName: input.institutionName || null,
            address: input.address || null,
          },
        },
      },
      include: {
        studentProfile: true,
      },
    });

    // 6. Sign JWT
    const payload: JwtUserPayload = {
      userId: newUser.id,
      email: newUser.email,
      role: UserRole.STUDENT,
      branchId: newUser.branchId,
      institutionId: newUser.institutionId,
    };

    const accessToken = jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
      expiresIn: ENV.JWT_ACCESS_EXPIRES_IN as any,
    });

    return {
      accessToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: UserRole.STUDENT,
        branchId: newUser.branchId,
        avatarUrl: newUser.avatarUrl,
      },
    };
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        branchId: true,
        branch: { select: { id: true, name: true, code: true } },
        adminProfile: true,
        teacherProfile: true,
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
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }
}
