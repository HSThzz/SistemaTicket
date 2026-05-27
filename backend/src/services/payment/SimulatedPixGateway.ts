import { randomUUID } from "node:crypto";
import type {
  CreatePixChargeInput,
  PaymentGateway,
  PixChargeResult,
} from "./PaymentGateway";

const PIX_EXPIRATION_MS = 15 * 60 * 1000;

export class SimulatedPixGateway implements PaymentGateway {
  readonly provider = "simulated" as const;

  async createPixCharge(input: CreatePixChargeInput): Promise<PixChargeResult> {
    const transactionId = `pix_sim_${randomUUID()}`;
    const expiresAt = new Date(Date.now() + PIX_EXPIRATION_MS);

    const pixCopyPaste = buildSimulatedPixCopyPaste({
      transactionId,
      orderId: input.orderId,
      amountCents: input.amountCents,
      description: input.description,
    });

    return {
      transactionId,
      pixCopyPaste,
      expiresAt,
    };
  }

  async refundPayment(_transactionId: string): Promise<void> {
    // Simulador: reembolso registrado apenas no banco.
  }
}

function buildSimulatedPixCopyPaste(params: {
  transactionId: string;
  orderId: string;
  amountCents: number;
  description: string;
}): string {
  const amount = (params.amountCents / 100).toFixed(2);

  return [
    "00020126",
    "580014br.gov.bcb.pix",
    `0136${params.transactionId}`,
    "520400005303986",
    `540${amount.length}${amount}`,
    "5802BR",
    `5913${params.description.slice(0, 13)}`,
    `6008${params.orderId.slice(0, 8)}`,
    "6304SIMU",
  ].join("");
}
