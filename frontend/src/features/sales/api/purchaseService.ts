import { api } from "../../../shared/api/client";
import type { ReservationStatusView, ReserveTicketsResponse } from "../../../types/api";

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

export async function getReservationStatus(
  reservationId: string,
): Promise<ReservationStatusView> {
  const { data } = await api.get<ReservationStatusView>(
    `/purchases/reservations/${reservationId}`,
  );
  return data;
}

export async function simulateDevPayment(orderId: string): Promise<void> {
  await api.post("/payments/dev/simulate", { orderId });
}

export const TERMINAL_PHASES = new Set<ReservationStatusView["phase"]>([
  "PAID",
  "EXPIRED",
  "FAILED",
]);

/** Para o polling automático ao exibir o PIX (dados estáveis até o pagamento). */
export const CHECKOUT_POLL_STOP_PHASES = new Set<ReservationStatusView["phase"]>([
  "AWAITING_PAYMENT",
  ...TERMINAL_PHASES,
]);

export const AWAITING_PAYMENT_PHASES = new Set<ReservationStatusView["phase"]>([
  "AWAITING_PAYMENT",
  ...TERMINAL_PHASES,
]);
