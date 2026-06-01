/**
 * @file Gateway PIX simulado para desenvolvimento e testes locais.
 * @module payment/infrastructure/gateways/SimulatedPixGateway
 */

import { randomUUID } from "node:crypto";
import type {
  CreatePixChargeInput,
  PaymentGateway,
  PixChargeResult,
} from "./PaymentGateway";

const PIX_EXPIRATION_MS = 15 * 60 * 1000;

/**
 * Gera cobranças PIX fictícias sem chamada externa.
 */
export class SimulatedPixGateway implements PaymentGateway {
  readonly provider = "simulated" as const;

  /**
   * @param input - Dados do pedido para montar o payload EMV simulado.
   * @returns Transação fictícia com QR/copia-e-cola e TTL de 15 minutos.
   */
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

  /**
   * No-op: reembolso é refletido apenas no banco da aplicação.
   * @param _transactionId - ID ignorado no simulador.
   */
  async refundPayment(_transactionId: string): Promise<void> {
    // Simulador: reembolso registrado apenas no banco.
  }
}

/**
 * Monta string no formato EMV simplificado para testes de UI.
 * @param params - Metadados da cobrança simulada.
 * @returns Payload PIX copia-e-cola fictício.
 */
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
