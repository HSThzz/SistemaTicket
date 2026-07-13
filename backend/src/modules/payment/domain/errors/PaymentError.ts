/**
 * @file Erros de domínio do módulo de pagamento, webhooks e reembolsos.
 * @module payment/domain/errors/PaymentError
 */

/**
 * Erro base para operações de pagamento.
 */
export class PaymentError extends Error {
  /**
   * @param message - Mensagem legível do erro.
   * @param code - Código estável para API e logs.
   */
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

/**
 * Pedido não encontrado ou inacessível ao usuário.
 */
export class OrderNotFoundError extends PaymentError {
  /**
   * @param orderId - Identificador do pedido.
   */
  constructor(orderId: string) {
    super(`Order ${orderId} not found`, "ORDER_NOT_FOUND");
    this.name = "OrderNotFoundError";
  }
}

/**
 * Payload de webhook inválido ou incompleto.
 */
export class InvalidWebhookPayloadError extends PaymentError {
  /**
   * @param message - Detalhe da validação que falhou.
   */
  constructor(message: string) {
    super(message, "INVALID_WEBHOOK_PAYLOAD");
    this.name = "InvalidWebhookPayloadError";
  }
}

/**
 * Pedido gratuito não pode gerar cobrança no gateway.
 */
export class FreeOrderPaymentNotAllowedError extends PaymentError {
  constructor(orderId: string) {
    super(
      `Order ${orderId} is free and does not require payment`,
      "FREE_ORDER_PAYMENT_NOT_ALLOWED",
    );
    this.name = "FreeOrderPaymentNotAllowedError";
  }
}

/**
 * Pedido já foi processado (pago, falho ou estado terminal).
 */
export class PaymentAlreadyProcessedError extends PaymentError {
  /**
   * @param orderId - Identificador do pedido.
   * @param status - Status atual que impede reprocessamento.
   */
  constructor(orderId: string, status: string) {
    super(
      `Order ${orderId} already processed with status ${status}`,
      "PAYMENT_ALREADY_PROCESSED",
    );
    this.name = "PaymentAlreadyProcessedError";
  }
}

/**
 * Pagamento via cartão não suportado pelo gateway atualmente configurado.
 */
export class CardPaymentUnsupportedError extends PaymentError {
  constructor() {
    super(
      "Pagamento com cartão requer o gateway Mercado Pago configurado",
      "CARD_PAYMENT_UNSUPPORTED",
    );
    this.name = "CardPaymentUnsupportedError";
  }
}

/**
 * Falha na comunicação ou resposta do gateway de pagamento.
 */
export class PaymentGatewayError extends PaymentError {
  /**
   * @param message - Mensagem retornada ou descritiva.
   * @param code - Código específico do gateway (padrão `PAYMENT_GATEWAY_ERROR`).
   */
  constructor(message: string, code = "PAYMENT_GATEWAY_ERROR") {
    super(message, code);
    this.name = "PaymentGatewayError";
  }
}

/**
 * Webhook rejeitado por autenticação ou assinatura inválida.
 */
export class WebhookUnauthorizedError extends PaymentError {
  /**
   * @param message - Motivo da rejeição (padrão genérico).
   */
  constructor(message = "Unauthorized webhook") {
    super(message, "WEBHOOK_UNAUTHORIZED");
    this.name = "WebhookUnauthorizedError";
  }
}

/**
 * Webhook duplicado detectado pela chave de deduplicação no Redis.
 */
export class WebhookReplayError extends PaymentError {
  constructor() {
    super("Webhook already processed", "WEBHOOK_REPLAY");
    this.name = "WebhookReplayError";
  }
}

/**
 * Reembolso não permitido para o estado atual do pedido ou ingressos.
 */
export class OrderRefundNotAllowedError extends PaymentError {
  /**
   * @param message - Motivo do bloqueio.
   * @param code - Código de negócio (padrão `ORDER_NOT_REFUNDABLE`).
   */
  constructor(message: string, code = "ORDER_NOT_REFUNDABLE") {
    super(message, code);
    this.name = "OrderRefundNotAllowedError";
  }
}

/**
 * Pedido já foi reembolsado anteriormente.
 */
export class OrderAlreadyRefundedError extends PaymentError {
  /**
   * @param orderId - Identificador do pedido.
   */
  constructor(orderId: string) {
    super(`Order ${orderId} is already refunded`, "ORDER_ALREADY_REFUNDED");
    this.name = "OrderAlreadyRefundedError";
  }
}

/**
 * Valor cobrado no gateway difere do total do pedido.
 */
export class PaymentAmountMismatchError extends PaymentError {
  constructor(orderId: string, expectedCents: number, gatewayCents: number) {
    super(
      `Payment amount mismatch for order ${orderId}: expected ${expectedCents}, gateway ${gatewayCents}`,
      "PAYMENT_AMOUNT_MISMATCH",
    );
    this.name = "PaymentAmountMismatchError";
  }
}

/**
 * Gateway reembolsou, mas a atualização local falhou após retentativas.
 */
export class RefundLocalStateError extends PaymentError {
  constructor(orderId: string, cause: string) {
    super(
      `Gateway refund succeeded but local state update failed for order ${orderId}: ${cause}`,
      "REFUND_LOCAL_STATE_ERROR",
    );
    this.name = "RefundLocalStateError";
  }
}
