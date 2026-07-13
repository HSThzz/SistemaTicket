/**
 * @file Extensões de tipos do Express para autenticação e corpo bruto.
 * @module shared/interfaces/http/types/express
 */

import type { UserRole } from "../../../kernel/enums";

declare global {
  namespace Express {
    /** Payload do usuário autenticado anexado à requisição. */
    interface UserPayload {
      id: string;
      role: UserRole;
      /** `jti` do JWT atual (para logout). */
      jti?: string;
      /** Unix exp do JWT atual (para TTL da denylist). */
      tokenExp?: number;
    }

    interface Request {
      /** Usuário decodificado do JWT, quando autenticado. */
      user?: UserPayload;
      /** Corpo bruto da requisição (ex.: validação de webhook). */
      rawBody?: Buffer;
    }
  }
}

export {};
