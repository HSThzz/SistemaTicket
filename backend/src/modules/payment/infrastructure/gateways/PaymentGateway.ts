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
 * Dados necessários para criar uma cobrança via cartão de crédito.
 *
 * O `token` é gerado no front-end pelo SDK do Mercado Pago; os dados brutos
 * do cartão nunca trafegam pelo nosso back-end.
 */
export interface CreateCardChargeInput {
  orderId: string;
  amountCents: number;
  description: string;
  /** Token do cartão gerado pelo MercadoPago.js no front-end. */
  token: string;
  /** Bandeira/meio de pagamento (ex.: `visa`, `master`). */
  paymentMethodId: string;
  /** Emissor do cartão (obrigatório para cartão no Brasil). */
  issuerId: number;
  /** Número de parcelas (default 1). */
  installments: number;
  payerEmail: string;
  payerDocument?: string;
}

/**
 * Resultado da criação de cobrança via cartão no gateway.
 */
export interface CardChargeResult {
  transactionId: string;
  status: GatewayPaymentStatus;
  /** Detalhe do status retornado pelo provedor (ex.: `accredited`, `cc_rejected_bad_filled_security_code`). */
  statusDetail?: string;
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

/**
 * Gateway capaz de processar pagamentos via cartão de crédito (Mercado Pago).
 */
export interface PaymentGatewayWithCard extends PaymentGateway {
  /**
   * Cria uma cobrança via cartão usando o token gerado no front-end.
   * @param input - Dados do pedido, token do cartão, parcelas e pagador.
   * @returns Transação criada e status normalizado.
   * @throws {PaymentGatewayError} Em falha de API do provedor.
   */
  createCardCharge(input: CreateCardChargeInput): Promise<CardChargeResult>;
}
