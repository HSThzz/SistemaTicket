import type { User } from "../../../../shared/infrastructure/persistence/entities/User";
import type { AuthUserProfile } from "../types";

/** Mapeia entidade User para o perfil exposto na API. */
export function toUserProfile(user: User): AuthUserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    document: user.document,
  };
}
