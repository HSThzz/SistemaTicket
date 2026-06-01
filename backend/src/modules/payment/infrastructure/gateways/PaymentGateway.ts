/**
 * @file Contratos do gateway de pagamento PIX (cobrança e reembolso).
 * @module payment/infrastructure/gateways/PaymentGateway
 */

/**
 * Dados necessários para criar uma cobrança PIX.
 */
export interface CreatePixChargeInput {
  orderId: string;
  amountCents: number;
  description: string;
  payerEmail: string;
  payerFirstName?: string;
  payerDocument?: string;
}

/**
 * Resultado da criação de cobrança PIX no gateway.
 */
export interface PixChargeResult {
  transactionId: string;
  pixCopyPaste: string;
  expiresAt: Date;
}

/**
 * Status normalizado de um pagamento no gateway.
 */
export type GatewayPaymentStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "cancelled"
  | "failed";

/**
 * Snapshot de pagamento para conciliação via webhook ou consulta.
 */
export interface GatewayPaymentSnapshot {
  transactionId: string;
  orderId: string;
  status: GatewayPaymentStatus;
  failureReason?: string;
}

/**
 * Abstração de provedor PIX (simulado ou Mercado Pago).
 */
export interface PaymentGateway {
  readonly provider: "simulated" | "mercadopago";
  /**
   * Cria cobrança PIX vinculada ao pedido.
   * @param input - Dados do pedido e pagador.
   * @returns Identificador da transação, copia-e-cola e expiração.
   * @throws {PaymentGatewayError} Em falha de API do provedor.
   */
  createPixCharge(input: CreatePixChargeInput): Promise<PixChargeResult>;
  /**
   * Solicita reembolso no gateway pelo ID da transação.
   * @param transactionId - ID do pagamento no provedor.
   */
  refundPayment(transactionId: string): Promise<void>;
}

/**
 * Gateway com consulta de status de pagamento (Mercado Pago).
 */
export interface PaymentGatewayWithLookup extends PaymentGateway {
  /**
   * @param transactionId - ID do pagamento no provedor.
   * @returns Snapshot com status mapeado para o domínio.
   */
  getPayment(transactionId: string): Promise<GatewayPaymentSnapshot>;
}
