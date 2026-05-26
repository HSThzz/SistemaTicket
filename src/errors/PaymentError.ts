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

export class PaymentGatewayError extends PaymentError {
  constructor(message: string, code = "PAYMENT_GATEWAY_ERROR") {
    super(message, code);
    this.name = "PaymentGatewayError";
  }
}

export class WebhookUnauthorizedError extends PaymentError {
  constructor(message = "Unauthorized webhook") {
    super(message, "WEBHOOK_UNAUTHORIZED");
    this.name = "WebhookUnauthorizedError";
  }
}

export class WebhookReplayError extends PaymentError {
  constructor() {
    super("Webhook already processed", "WEBHOOK_REPLAY");
    this.name = "WebhookReplayError";
  }
}

export class OrderRefundNotAllowedError extends PaymentError {
  constructor(message: string, code = "ORDER_NOT_REFUNDABLE") {
    super(message, code);
    this.name = "OrderRefundNotAllowedError";
  }
}

export class OrderAlreadyRefundedError extends PaymentError {
  constructor(orderId: string) {
    super(`Order ${orderId} is already refunded`, "ORDER_ALREADY_REFUNDED");
    this.name = "OrderAlreadyRefundedError";
  }
}
