import { Logger } from "../../../../shared/infrastructure/config/logger";
import { revokeAuthToken } from "../helpers/authTokenDenylist";

const CONTEXT = "logoutUser";

export type LogoutUserInput = {
  jti?: string;
  tokenExp?: number;
};

/**
 * Invalida o JWT atual na denylist Redis (logout server-side).
 * Tokens legados sem `jti` são tratados como sucesso no cliente (descarta o token).
 */
export async function logoutUser(input: LogoutUserInput) {
  const { jti, tokenExp } = input;

  if (!jti) {
    Logger.getInstance().info(CONTEXT, "Logout without jti (legacy token)");
    return { success: true as const };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const ttlSeconds = tokenExp
    ? Math.max(1, tokenExp - nowSeconds)
    : 24 * 60 * 60;

  await revokeAuthToken(jti, ttlSeconds);

  Logger.getInstance().info(CONTEXT, "Token revoked", { jti });

  return { success: true as const };
}
