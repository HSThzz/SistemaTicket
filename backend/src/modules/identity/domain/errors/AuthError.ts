/**
 * @file Erros de domínio do módulo de identidade e autenticação.
 * @module modules/identity/domain/errors/AuthError
 */

/** Erro base de autenticação com código estável para a API. */
export class AuthError extends Error {
  /**
   * @param message - Mensagem descritiva.
   * @param code - Código de erro exposto ao cliente.
   */
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** Credenciais de login inválidas (email ou senha). */
export class InvalidCredentialsError extends AuthError {
  constructor() {
    super("Invalid email or password", "INVALID_CREDENTIALS");
    this.name = "InvalidCredentialsError";
  }
}

/** Email já cadastrado no registro. */
export class EmailAlreadyExistsError extends AuthError {
  /**
   * @param email - Email em conflito.
   */
  constructor(email: string) {
    super(`Email already registered: ${email}`, "EMAIL_ALREADY_EXISTS");
    this.name = "EmailAlreadyExistsError";
  }
}

/** CPF já cadastrado no registro ou atualização de perfil. */
export class DocumentAlreadyExistsError extends AuthError {
  /**
   * @param document - CPF em conflito (apenas dígitos).
   */
  constructor(document: string) {
    super(`Document already registered: ${document}`, "DOCUMENT_ALREADY_EXISTS");
    this.name = "DocumentAlreadyExistsError";
  }
}

/** Requisição sem autenticação ou token inválido. */
export class UnauthorizedError extends AuthError {
  /**
   * @param message - Mensagem opcional (padrão: "Unauthorized").
   */
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

/** Usuário autenticado sem permissão para a operação. */
export class ForbiddenError extends AuthError {
  constructor() {
    super("Forbidden", "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

/** Usuário não encontrado pelo identificador. */
export class UserNotFoundError extends AuthError {
  /**
   * @param userId - ID do usuário ausente.
   */
  constructor(userId: string) {
    super(`User ${userId} not found`, "USER_NOT_FOUND");
    this.name = "UserNotFoundError";
  }
}

/** Senha atual incorreta ao alterar senha. */
export class InvalidCurrentPasswordError extends AuthError {
  constructor() {
    super("Current password is incorrect", "INVALID_CURRENT_PASSWORD");
    this.name = "InvalidCurrentPasswordError";
  }
}

/** Papel de usuário inválido na atualização de role. */
export class InvalidRoleError extends AuthError {
  /**
   * @param role - Valor de papel rejeitado.
   */
  constructor(role: string) {
    super(`Invalid role: ${role}`, "INVALID_ROLE");
    this.name = "InvalidRoleError";
  }
}

/** Tentativa de alterar papel sem privilégio de super administrador. */
export class RoleAssignmentForbiddenError extends AuthError {
  constructor() {
    super(
      "Only super admins can change user roles",
      "ROLE_ASSIGNMENT_FORBIDDEN",
    );
    this.name = "RoleAssignmentForbiddenError";
  }
}
