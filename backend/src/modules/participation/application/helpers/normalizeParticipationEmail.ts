/**
 * @file Normaliza e-mail para dedupe de solicitações de participação.
 * @module modules/participation/application/helpers/normalizeParticipationEmail
 */

/** Remove espaços e converte para minúsculas antes de comparar ou persistir. */
export function normalizeParticipationEmail(email: string): string {
  return email.trim().toLowerCase();
}
