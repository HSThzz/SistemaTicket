/**
 * @file Serviço de envio de e-mail quando o pedido é reembolsado.
 * @module modules/notifications/application/services/sendOrderRefundNotification
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { redactEmail } from "../../../../shared/kernel/redactEmail";
import { sanitizeEmailHeader } from "../../../../shared/kernel/sanitizeEmailHeader";
import type { EmailProvider } from "../../infrastructure/email/EmailProvider";
import { buildOrderRefundEmail } from "../../infrastructure/email/emailTemplates";
import { StubEmailProvider } from "../../infrastructure/email/StubEmailProvider";
import {
  claimEmailDelivery,
  releaseEmailDeliveryClaim,
} from "../helpers/emailDeliveryLedger";
import type { OrderRefundJobData } from "../types/orderRefundJob";

const CONTEXT = "SendOrderRefundNotification";
const logger = Logger.getInstance();

let emailProvider: EmailProvider = new StubEmailProvider();

/** Permite injetar provedor real de e-mail. */
export function setOrderRefundEmailProvider(provider: EmailProvider): void {
  emailProvider = provider;
}

/** Provedor usado pelo worker de reembolso. */
export function getOrderRefundEmailProvider(): EmailProvider {
  return emailProvider;
}

/**
 * Envia e-mail transacional informando que o pedido foi reembolsado.
 */
export async function sendOrderRefundNotification(
  data: OrderRefundJobData,
): Promise<void> {
  const deliveryKey = `order-refund:${data.orderId}`;

  if (!(await claimEmailDelivery(deliveryKey))) {
    logger.info(CONTEXT, "Order refund email skipped — already sent", {
      orderId: data.orderId,
    });
    return;
  }

  try {
    logger.info(CONTEXT, "Processing order refund notification", {
      orderId: data.orderId,
      email: redactEmail(data.userEmail),
    });

    await emailProvider.send({
      to: data.userEmail,
      subject: sanitizeEmailHeader(
        `Reembolso confirmado — ${data.eventTitle}`,
      ),
      html: buildOrderRefundEmail(data),
    });

    logger.info(CONTEXT, "Order refund notification sent", {
      orderId: data.orderId,
    });
  } catch (error) {
    await releaseEmailDeliveryClaim(deliveryKey);
    throw error;
  }
}
