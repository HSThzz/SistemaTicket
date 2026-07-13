/**
 * @file Command: enfileira notificações externas do formulário de contato.
 * @module modules/leads/application/commands/enqueueContactFormNotification
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { isDuplicateJobError } from "../../../../shared/infrastructure/messaging/isDuplicateJobError";
import { getContactFormQueue } from "../../infrastructure/queues/contactFormQueue";
import type { ContactFormJobData } from "../types/contactFormJob";

const CONTEXT = "EnqueueContactFormNotification";
const logger = Logger.getInstance();

/**
 * Adiciona job na fila `contact-form` após persistir o lead.
 */
export async function enqueueContactFormNotification(
  data: ContactFormJobData,
): Promise<void> {
  const jobId = `contact-form:${data.leadId}`;

  try {
    const contactQueue = getContactFormQueue();

    await contactQueue.add("notify", data, { jobId });

    logger.info(CONTEXT, "Contact form notification job enqueued", {
      leadId: data.leadId,
      jobId,
    });
  } catch (error) {
    if (isDuplicateJobError(error)) {
      logger.info(CONTEXT, "Contact form notification job already enqueued", {
        leadId: data.leadId,
        jobId,
      });
      return;
    }

    logger.error(CONTEXT, "Failed to enqueue contact form notification", {
      leadId: data.leadId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
