import type { UserRole } from "../../../kernel/enums";

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      role: UserRole;
    }

    interface Request {
      user?: UserPayload;
      rawBody?: Buffer;
    }
  }
}

export {};
