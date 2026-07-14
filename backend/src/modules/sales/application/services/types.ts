import type { OrderStatus, ReservationStatus } from "../../../../shared/kernel/enums";
import type { PixPaymentDetails } from "../../../payment/application/types";

export interface OrderListItem {
  id: string;
  status: string;
  totalPrice: number;
  platformFeeCents: number;
  paymentGatewayId: string | null;
  reservationId: string;
  eventId: string | null;
  eventTitle: string | null;
  createdAt: string;
  payment: PixPaymentDetails | null;
}

export interface OrderAdminDetails extends OrderListItem {
  userId: string;
  userName: string;
  userEmail: string;
}

export interface ReservationCachePayload {
  reservationId: string;
  userId: string;
  ticketLotId: string;
  quantity: number;
}

export interface ReserveTicketsResult {
  reservationId: string;
  expiresAt: string;
  ticketLotId: string;
  quantity: number;
  remainingStock: number;
}

export type ReservationPhase =
  | "PENDING_PERSISTENCE"
  | "PENDING_PAYMENT"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "EXPIRED"
  | "FAILED"
  | "NOT_FOUND";

export interface ReservationStatusView {
  reservationId: string;
  phase: ReservationPhase;
  reservation: {
    id: string;
    status: ReservationStatus | "PENDING_PERSISTENCE";
    expiresAt: string;
    quantity: number;
    ticketLotId: string;
  } | null;
  order: {
    id: string;
    status: OrderStatus;
    totalPrice: number;
    platformFeeCents: number;
    paymentGatewayId: string | null;
  } | null;
  payment: PixPaymentDetails | null;
  meta: {
    inRedis: boolean;
    persistedToPostgres: boolean;
    queuePendingJobs: number;
  };
}

export type ReservationRedisPayload = {
  reservationId: string;
  userId: string;
  ticketLotId: string;
  quantity: number;
  expiresAt: string;
};

export type PersistJobPayload = {
  ticketLotId?: string;
  quantity?: number;
};

export interface LotReconciliationResult {
  ticketLotId: string;
  pgAvailable: number;
  pendingInQueues: number;
  expectedRedis: number;
  previousRedis: number | null;
  corrected: boolean;
}

export interface StockReconciliationReport {
  checkedAt: string;
  lotsChecked: number;
  correctedCount: number;
  lots: LotReconciliationResult[];
}
