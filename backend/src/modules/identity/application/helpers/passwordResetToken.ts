import { createHash, randomBytes } from "node:crypto";

/** Validade padrão do link de redefinição de senha. */
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export function hashPasswordResetToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function generatePasswordResetToken(): {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashPasswordResetToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

  return { rawToken, tokenHash, expiresAt };
}
