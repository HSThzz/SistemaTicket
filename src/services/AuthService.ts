import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { DataSource } from "typeorm";
import { env } from "../config/env";
import { Logger } from "../config/logger";
import { User } from "../entities/User";
import { UserRole } from "../entities/enums";
import {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
} from "../errors/AuthError";

const CONTEXT = "AuthService";
const BCRYPT_ROUNDS = 12;

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  document: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export class AuthService {
  private readonly logger = Logger.getInstance();

  constructor(private readonly dataSource: DataSource) {}

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
      role: input.role ?? UserRole.CLIENT,
    });

    await repository.save(user);

    this.logger.info(CONTEXT, "User registered", {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return this.buildAuthResponse(user);
  }

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
