/**
 * @file Command: enfileira notificações externas do formulário de contato.
 * @module modules/leads/application/commands/enqueueContactFormNotification
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
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
  try {
    const contactQueue = getContactFormQueue();

    await contactQueue.add("notify", data);

    logger.info(CONTEXT, "Contact form notification job enqueued", {
      leadId: data.leadId,
    });
  } catch (error) {
    logger.error(CONTEXT, "Failed to enqueue contact form notification", {
      leadId: data.leadId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
