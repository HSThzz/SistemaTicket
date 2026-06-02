/**
 * @file Serviço de aplicação de registro, login e perfil de usuário.
 * @module modules/identity/application/AuthService
 */

import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { DataSource } from "typeorm";
import { env } from "../../../shared/infrastructure/config/env";
import { Logger } from "../../../shared/infrastructure/config/logger";
import { User } from "../../../shared/infrastructure/persistence/entities/User";
import { UserRole } from "../../../shared/kernel/enums";
import {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  UserNotFoundError,
} from "../domain/errors/AuthError";

const CONTEXT = "AuthService";
const BCRYPT_ROUNDS = 12;

/** Dados de entrada para cadastro de novo usuário. */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  document: string;
}

/** Dados de entrada para autenticação por email e senha. */
export interface LoginInput {
  email: string;
  password: string;
}

/** Claims embutidos no token JWT emitido. */
export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
}

/** Resposta de autenticação com token e dados públicos do usuário. */
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Orquestra registro, login, perfil e alteração de papel de usuários.
 */
export class AuthService {
  private readonly logger = Logger.getInstance();

  /**
   * @param dataSource - Fonte de dados TypeORM.
   */
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Registra um novo usuário com papel CLIENT.
   * @param input - Dados de cadastro.
   * @returns Token JWT e dados do usuário criado.
   * @throws {EmailAlreadyExistsError} Quando o email já está em uso.
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const repository = this.dataSource.getRepository(User);

    const existingUser = await repository.findOne({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new EmailAlreadyExistsError(input.email);
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const user = repository.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      document: input.document,
      role: UserRole.CLIENT,
    });

    await repository.save(user);

    this.logger.info(CONTEXT, "User registered", {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return this.buildAuthResponse(user);
  }

  /**
   * Autentica usuário por email e senha.
   * @param input - Credenciais de login.
   * @returns Token JWT e dados do usuário.
   * @throws {InvalidCredentialsError} Quando email ou senha não conferem.
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const repository = this.dataSource.getRepository(User);

    const user = await repository.findOne({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      this.logger.warn(CONTEXT, "Failed login attempt", {
        email: input.email.toLowerCase(),
        reason: "user_not_found",
      });
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      this.logger.warn(CONTEXT, "Failed login attempt", {
        email: user.email,
        userId: user.id,
        reason: "invalid_password",
      });
      throw new InvalidCredentialsError();
    }

    this.logger.info(CONTEXT, "User logged in", {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return this.buildAuthResponse(user);
  }

  /**
   * Retorna dados públicos do perfil do usuário autenticado.
   * @param userId - ID do usuário.
   * @returns Objeto usuário sem credenciais.
   * @throws {UserNotFoundError} Quando o usuário não existe.
   */
  async getProfile(userId: string): Promise<AuthResponse["user"]> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Atualiza o papel de um usuário (operação administrativa).
   * @param userId - ID do usuário alvo.
   * @param role - Novo papel.
   * @returns Dados públicos atualizados do usuário.
   * @throws {InvalidRoleError} Quando o papel não é válido.
   * @throws {UserNotFoundError} Quando o usuário não existe.
   */
  async updateUserRole(userId: string, role: UserRole): Promise<AuthResponse["user"]> {
    const repository = this.dataSource.getRepository(User);
    const user = await repository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    user.role = role;
    await repository.save(user);

    this.logger.info(CONTEXT, "User role updated", {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Busca usuário por e-mail (operação administrativa).
   * @param email - E-mail exato do usuário.
   * @returns Dados públicos do usuário.
   * @throws {UserNotFoundError} Quando não há cadastro com esse e-mail.
   */
  async lookupUserByEmail(email: string): Promise<AuthResponse["user"]> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new UserNotFoundError(email);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  /** Monta resposta com JWT assinado e snapshot do usuário. */
  private buildAuthResponse(user: User): AuthResponse {
    const payload: AuthTokenPayload = {
      userId: user.id,
      role: user.role,
    };

    const signOptions: SignOptions = {
      expiresIn: env.jwt.expiresIn as SignOptions["expiresIn"],
    };

    const token = jwt.sign(payload, env.jwt.secret, signOptions);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
