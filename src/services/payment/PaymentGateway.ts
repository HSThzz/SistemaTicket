export interface CreatePixChargeInput {
  orderId: string;
  amountCents: number;
  description: string;
}

export interface PixChargeResult {
  transactionId: string;
  pixCopyPaste: string;
  expiresAt: Date;
}

export interface PaymentGateway {
  createPixCharge(input: CreatePixChargeInput): Promise<PixChargeResult>;
}
