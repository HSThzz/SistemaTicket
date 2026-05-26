import { api } from "./api";
import type { ReservationStatusView, ReserveTicketsResponse } from "../types/api";

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

export const AWAITING_PAYMENT_PHASES = new Set<ReservationStatusView["phase"]>([
  "AWAITING_PAYMENT",
  "PAID",
  "EXPIRED",
  "FAILED",
]);
