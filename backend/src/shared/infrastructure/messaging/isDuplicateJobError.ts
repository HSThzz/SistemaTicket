/**
 * @file Detecta jobId duplicado do BullMQ (enqueue idempotente).
 * @module shared/infrastructure/messaging/isDuplicateJobError
 */

export function isDuplicateJobError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("already exists") ||
    (message.includes("job id") && message.includes("exist"))
  );
}
