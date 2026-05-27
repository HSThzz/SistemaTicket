export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor() {
    super("Invalid email or password", "INVALID_CREDENTIALS");
    this.name = "InvalidCredentialsError";
  }
}

export class EmailAlreadyExistsError extends AuthError {
  constructor(email: string) {
    super(`Email already registered: ${email}`, "EMAIL_ALREADY_EXISTS");
    this.name = "EmailAlreadyExistsError";
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AuthError {
  constructor() {
    super("Forbidden", "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class UserNotFoundError extends AuthError {
  constructor(userId: string) {
    super(`User ${userId} not found`, "USER_NOT_FOUND");
    this.name = "UserNotFoundError";
  }
}

export class InvalidRoleError extends AuthError {
  constructor(role: string) {
    super(`Invalid role: ${role}`, "INVALID_ROLE");
    this.name = "InvalidRoleError";
  }
}
