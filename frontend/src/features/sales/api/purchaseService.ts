/**
 * @file Cliente HTTP para reserva de ingressos, status e simulação de pagamento (dev).
 * @module features/sales/api/purchaseService
 */

import { api } from "../../../shared/api/client";
import type { ReservationStatusView, ReserveTicketsResponse } from "../../../types/api";

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
 * Consulta fase e detalhes (pedido, PIX) de uma reserva.
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

/** Fases em que o fluxo de compra terminou (sucesso ou falha definitiva). */
export const TERMINAL_PHASES = new Set<ReservationStatusView["phase"]>([
  "PAID",
  "EXPIRED",
  "FAILED",
]);

/**
 * Fases em que o polling do checkout pode parar (PIX exibido ou fim do fluxo).
 * Evita requisições desnecessárias enquanto o usuário paga.
 */
export const CHECKOUT_POLL_STOP_PHASES = new Set<ReservationStatusView["phase"]>([
  "AWAITING_PAYMENT",
  ...TERMINAL_PHASES,
]);

/** Fases consideradas como aguardando ou concluindo pagamento PIX. */
export const AWAITING_PAYMENT_PHASES = new Set<ReservationStatusView["phase"]>([
  "AWAITING_PAYMENT",
  ...TERMINAL_PHASES,
]);
