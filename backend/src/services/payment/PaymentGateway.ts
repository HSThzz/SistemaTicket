export interface CreatePixChargeInput {
  orderId: string;
  amountCents: number;
  description: string;
  payerEmail: string;
  payerFirstName?: string;
  payerDocument?: string;
}

export interface PixChargeResult {
  transactionId: string;
  pixCopyPaste: string;
  expiresAt: Date;
}

export type GatewayPaymentStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "cancelled"
  | "failed";

export interface GatewayPaymentSnapshot {
  transactionId: string;
  orderId: string;
  status: GatewayPaymentStatus;
  failureReason?: string;
}

export interface PaymentGateway {
  readonly provider: "simulated" | "mercadopago";
  createPixCharge(input: CreatePixChargeInput): Promise<PixChargeResult>;
  refundPayment(transactionId: string): Promise<void>;
}

export interface PaymentGatewayWithLookup extends PaymentGateway {
  getPayment(transactionId: string): Promise<GatewayPaymentSnapshot>;
}
