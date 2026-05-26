import type { UserRole } from "../entities/enums";

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      role: UserRole;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
