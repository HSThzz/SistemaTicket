import type { User } from "../../../../shared/infrastructure/persistence/entities/User";
import type { AuthUserProfile } from "../types";

export type ToUserProfileOptions = {
  /** Inclui CPF; use apenas em rotas de perfil (`/me`). */
  includeDocument?: boolean;
};

/** Mapeia entidade User para o perfil exposto na API. */
export function toUserProfile(
  user: User,
  options: ToUserProfileOptions = {},
): AuthUserProfile {
  const profile: AuthUserProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  if (options.includeDocument) {
    profile.document = user.document;
  }

  return profile;
}
