import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { UnauthorizedError } from "../common/errors/appError.js";
import { UserRole, type JwtUserPayload } from "../types/index.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
      branchContext?: {
        accessibleBranchIds: string[];
        isSuperAdmin: boolean;
      };
    }
  }
}

export const authGuard = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication token is missing or malformed");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET) as JwtUserPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        branchId: true,
        institutionId: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedError("User session has been revoked or account is deactivated");
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role as unknown as UserRole,
      branchId: user.branchId,
      institutionId: user.institutionId,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError("Token has expired. Please refresh your session"));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError("Invalid authentication token"));
    } else {
      next(error);
    }
  }
};
