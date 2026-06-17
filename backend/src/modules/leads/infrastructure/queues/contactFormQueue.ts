/**
 * @file Fila BullMQ de notificações do formulário de contato.
 * @module modules/leads/infrastructure/queues/contactFormQueue
 */

import { Queue } from "bullmq";
import { DEFAULT_JOB_OPTIONS } from "../../../../shared/infrastructure/messaging/defaultJobOptions";
import { getBullMQConnection } from "../../../../shared/infrastructure/messaging/bullmqConnection";
import { CONTACT_FORM_QUEUE } from "../../../../shared/infrastructure/messaging/queueNames";
import type { ContactFormJobData } from "../../application/types/contactFormJob";

let queue: Queue<ContactFormJobData> | null = null;

/** Retorna singleton da fila `contact-form`. */
export function getContactFormQueue(): Queue<ContactFormJobData> {
  if (!queue) {
    queue = new Queue<ContactFormJobData>(CONTACT_FORM_QUEUE, {
      connection: getBullMQConnection(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
  }

  return queue;
}

/** Encerra conexão da fila no graceful shutdown. */
export async function closeContactFormQueue(): Promise<void> {
  await queue?.close();
  queue = null;
}
