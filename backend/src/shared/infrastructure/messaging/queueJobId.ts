/**
 * @file Monta jobId determinístico compatível com BullMQ.
 * @module shared/infrastructure/messaging/queueJobId
 */

/**
 * Junta partes com `-`. BullMQ rejeita custom ids que contenham `:`.
 */
export function queueJobId(...parts: Array<string | number>): string {
  return parts.map(String).join("-");
}
