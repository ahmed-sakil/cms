import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthService } from "./auth.service.js";
import { prisma } from "../../config/prisma.js";
import { ENV } from "../../config/env.js";
import { UnauthorizedError } from "../../common/errors/appError.js";
import { UserRole } from "../../types/index.js";

vi.mock("../../config/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("AuthService Unit Tests", () => {
  const mockUser = {
    id: "usr-123",
    email: "admin@cms.internal",
    passwordHash: "$2a$10$hashedpasswordstring",
    fullName: "System Admin",
    role: "SUPER_ADMIN",
    branchId: "branch-main",
    institutionId: "inst-1",
    isActive: true,
    deletedAt: null,
    avatarUrl: null,
    refreshToken: null as string | null,
    branch: { id: "branch-main", name: "Main Campus", code: "MAIN" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AuthService.login", () => {
    it("successfully authenticates with valid credentials and returns session tokens", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.spyOn(bcrypt, "compare").mockImplementation(async () => true);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const result = await AuthService.login({
        email: "admin@cms.internal",
        password: "ValidPassword123!",
      });

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result.user).toEqual({
        id: "usr-123",
        email: "admin@cms.internal",
        fullName: "System Admin",
        role: UserRole.SUPER_ADMIN,
        branchId: "branch-main",
        avatarUrl: null,
      });

      // Verify tokens are valid JWTs
      const decodedAccess = jwt.verify(result.accessToken, ENV.JWT_ACCESS_SECRET) as any;
      expect(decodedAccess.userId).toBe("usr-123");
      expect(decodedAccess.role).toBe("SUPER_ADMIN");

      const decodedRefresh = jwt.verify(result.refreshToken!, ENV.JWT_REFRESH_SECRET) as any;
      expect(decodedRefresh.userId).toBe("usr-123");
    });

    it("throws UnauthorizedError when user is not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        AuthService.login({
          email: "unknown@cms.internal",
          password: "anypassword",
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it("throws UnauthorizedError when user is deactivated or deleted", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        isActive: false,
      } as any);

      await expect(
        AuthService.login({
          email: "admin@cms.internal",
          password: "password",
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it("throws UnauthorizedError when password does not match", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.spyOn(bcrypt, "compare").mockImplementation(async () => false);

      await expect(
        AuthService.login({
          email: "admin@cms.internal",
          password: "WrongPassword!",
        })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("AuthService.refresh", () => {
    it("successfully issues a new access token when given a valid refresh token", async () => {
      const validRefreshToken = jwt.sign(
        {
          userId: "usr-123",
          email: "admin@cms.internal",
          role: "SUPER_ADMIN",
          branchId: "branch-main",
        },
        ENV.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        refreshToken: validRefreshToken,
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const result = await AuthService.refresh(validRefreshToken);

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result.user.email).toBe("admin@cms.internal");
    });

    it("throws UnauthorizedError when refresh token string is empty or missing", async () => {
      await expect(AuthService.refresh("")).rejects.toThrow(UnauthorizedError);
    });

    it("throws UnauthorizedError when refresh token signature is invalid", async () => {
      const invalidToken = jwt.sign({ userId: "usr-123" }, "wrong-secret-key");
      await expect(AuthService.refresh(invalidToken)).rejects.toThrow(UnauthorizedError);
    });

    it("throws UnauthorizedError when refresh token in DB does not match provided token (revoked)", async () => {
      const token = jwt.sign(
        { userId: "usr-123", email: "admin@cms.internal", role: "SUPER_ADMIN" },
        ENV.JWT_REFRESH_SECRET
      );

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        refreshToken: "different-token-stored-in-db",
      } as any);

      await expect(AuthService.refresh(token)).rejects.toThrow(
        "Session has been revoked or expired"
      );
    });
  });
});
