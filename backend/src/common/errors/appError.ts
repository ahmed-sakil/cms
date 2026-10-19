export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors?: Record<string, string[]> | string | null;

  constructor(message: string, statusCode = 400, errors: Record<string, string[]> | string | null = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden - insufficient permissions") {
    super(message, 403);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", errors?: Record<string, string[]> | string | null) {
    super(message, 400, errors);
  }
}
