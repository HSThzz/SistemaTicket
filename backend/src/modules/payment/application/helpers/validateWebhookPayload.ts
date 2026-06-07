import { InvalidWebhookPayloadError } from "../../domain/errors/PaymentError";
import type { PaymentWebhookPayload } from "../types";

export function validateWebhookPayload(payload: PaymentWebhookPayload): void {
  if (!payload?.event || !payload?.data) {
    throw new InvalidWebhookPayloadError("Missing event or data");
  }

  if (
    payload.event !== "payment.succeeded" &&
    payload.event !== "payment.failed"
  ) {
    throw new InvalidWebhookPayloadError(`Unsupported event: ${payload.event}`);
  }

  if (!payload.data.orderId || !payload.data.transactionId) {
    throw new InvalidWebhookPayloadError(
      "orderId and transactionId are required",
    );
  }
}
