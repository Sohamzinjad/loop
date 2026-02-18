export class AppError extends Error {
  constructor(
    message: string,
    public code: string = "APP_ERROR",
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "AUTH_ERROR", 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Forbidden") {
    super(message, "FORBIDDEN", 403);
  }
}
