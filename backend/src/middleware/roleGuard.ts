import type { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../common/errors/appError.js";
import { UserRole } from "../types/index.js";

export const roleGuard = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required before role check"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Forbidden: Required one of [${allowedRoles.join(", ")}], but found ${req.user.role}`
        )
      );
    }

    next();
  };
};
