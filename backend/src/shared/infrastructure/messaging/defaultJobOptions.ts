/**
 * @file Opções padrão de jobs BullMQ (retentativas e backoff).
 * @module shared/infrastructure/messaging/defaultJobOptions
 */

import type { DefaultJobOptions } from "bullmq";

/** 1 tentativa inicial + 3 retentativas com backoff exponencial a partir de 3s. */
export const DEFAULT_JOB_OPTIONS: DefaultJobOptions = {
  attempts: 4,
  backoff: {
    type: "exponential",
    delay: 3_000,
  },
  removeOnComplete: 100,
  removeOnFail: 500,
};
