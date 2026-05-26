export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

export class OrderNotFoundError extends PaymentError {
  constructor(orderId: string) {
    super(`Order ${orderId} not found`, "ORDER_NOT_FOUND");
    this.name = "OrderNotFoundError";
  }
}

export class InvalidWebhookPayloadError extends PaymentError {
  constructor(message: string) {
    super(message, "INVALID_WEBHOOK_PAYLOAD");
    this.name = "InvalidWebhookPayloadError";
  }
}

export class PaymentAlreadyProcessedError extends PaymentError {
  constructor(orderId: string, status: string) {
    super(
      `Order ${orderId} already processed with status ${status}`,
      "PAYMENT_ALREADY_PROCESSED",
    );
    this.name = "PaymentAlreadyProcessedError";
  }
}
