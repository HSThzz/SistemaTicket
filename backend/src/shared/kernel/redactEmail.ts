/**
 * @file Redação de e-mail para logs (reduz exposição de PII).
 * @module shared/kernel/redactEmail
 */

/** Ex.: `user@domain.com` → `us***@domain.com`. */
export function redactEmail(email: string): string {
  const normalized = email.trim();
  const at = normalized.indexOf("@");

  if (at <= 0) {
    return "***";
  }

  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  const visible = local.slice(0, Math.min(2, local.length));

  return `${visible}***@${domain || "***"}`;
}
