import type { Request, Response, NextFunction } from "express";
import { UserRole } from "../types/index.js";
import { ForbiddenError, UnauthorizedError } from "../common/errors/appError.js";

export const branchContext = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new UnauthorizedError("Authentication required for branch resolution"));
  }

  const isSuperAdmin = req.user.role === UserRole.SUPER_ADMIN;

  req.branchContext = {
    isSuperAdmin,
    accessibleBranchIds: isSuperAdmin
      ? [] // Empty indicates universal access across all branches
      : req.user.branchId
      ? [req.user.branchId]
      : [],
  };

  next();
};

export const requireBranchAccess = (paramName = "branchId") => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.branchContext) {
      return next(new UnauthorizedError("Branch context not initialized"));
    }

    if (req.branchContext.isSuperAdmin) {
      return next();
    }

    const targetBranchId = req.params[paramName] || req.body[paramName] || req.query[paramName];
    if (
      !targetBranchId ||
      !req.branchContext.accessibleBranchIds.includes(String(targetBranchId))
    ) {
      return next(
        new ForbiddenError("Access denied: You do not have permissions for this branch")
      );
    }

    next();
  };
};
