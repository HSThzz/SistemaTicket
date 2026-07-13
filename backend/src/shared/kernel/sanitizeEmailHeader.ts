/**
 * @file Sanitiza valores usados em headers de e-mail (Subject, etc.).
 * @module shared/kernel/sanitizeEmailHeader
 */

/** Remove CR/LF e limita tamanho para evitar header injection. */
export function sanitizeEmailHeader(value: string, maxLength = 180): string {
  return value
    .replace(/[\r\n\u0000]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}
