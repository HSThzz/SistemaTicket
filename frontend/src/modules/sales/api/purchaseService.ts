/**
 * @file Cliente HTTP para reserva de ingressos, status e pagamentos.
 * @module modules/sales/api/purchaseService
 */

import { api } from "@/shared/api/client";
import type {
  PixPaymentDetails,
  ReservationStatusView,
  ReserveTicketsResponse,
  StockReconciliationReport,
} from "@/shared/types/api";

/**
 * Reserva ingressos de um lote, decrementando estoque temporariamente.
 *
 * @param ticketLotId - ID do lote.
 * @param quantity - Quantidade desejada.
 */
export async function reserveTickets(
  ticketLotId: string,
  quantity: number,
): Promise<ReserveTicketsResponse> {
  const { data } = await api.post<ReserveTicketsResponse>("/purchases/reserve", {
    ticketLotId,
    quantity,
  });
  return data;
}

/**
 * Consulta fase e detalhes (pedido, pagamento) de uma reserva.
 *
 * @param reservationId - ID da reserva.
 */
export async function getReservationStatus(
  reservationId: string,
): Promise<ReservationStatusView> {
  const { data } = await api.get<ReservationStatusView>(
    `/purchases/reservations/${reservationId}`,
  );
  return data;
}

/**
 * Simula confirmação de pagamento PIX em ambiente de desenvolvimento.
 *
 * @param orderId - ID do pedido associado.
 */
export async function simulateDevPayment(orderId: string): Promise<void> {
  await api.post("/payments/dev/simulate", { orderId });
}

/**
 * Gera cobrança PIX sob demanda para um pedido pendente (quando o usuário escolhe PIX).
 *
 * @param orderId - ID do pedido associado.
 */
export async function createPixPayment(orderId: string): Promise<PixPaymentDetails> {
  const { data } = await api.post<{ payment: PixPaymentDetails }>("/payments/pix", {
    orderId,
  });
  return data.payment;
}

/** Payload de pagamento via cartão (token gerado pelo SDK do Mercado Pago). */
export interface CardPaymentPayload {
  orderId: string;
  token: string;
  paymentMethodId: string;
  issuerId: number;
  installments: number;
  payerEmail?: string;
  payerDocument?: string;
}

/** Resultado do processamento de pagamento via cartão no back-end. */
export interface CardPaymentResult {
  orderId: string;
  transactionId: string;
  status: "approved" | "pending" | "rejected";
  statusDetail?: string;
}

/**
 * Processa um pagamento via cartão de crédito para um pedido pendente.
 *
 * @param payload - Token do cartão, bandeira, parcelas e dados do pagador.
 */
export async function payWithCard(
  payload: CardPaymentPayload,
): Promise<CardPaymentResult> {
  const { data } = await api.post<CardPaymentResult>("/payments/card", payload);
  return data;
}

/**
 * Fases em que o fluxo de compra terminou (sucesso ou falha definitiva).
 */
export const TERMINAL_PHASES = new Set<ReservationStatusView["phase"]>([
  "PAID",
  "EXPIRED",
  "FAILED",
]);

/** Fases consideradas como aguardando ou concluindo pagamento. */
export const AWAITING_PAYMENT_PHASES = new Set<ReservationStatusView["phase"]>([
  "AWAITING_PAYMENT",
  ...TERMINAL_PHASES,
]);

/**
 * Executa reconciliação manual de estoque (super admin).
 */
export async function reconcileStock(): Promise<StockReconciliationReport> {
  const { data } = await api.post<StockReconciliationReport>(
    "/purchases/ops/stock/reconcile",
  );
  return data;
}
