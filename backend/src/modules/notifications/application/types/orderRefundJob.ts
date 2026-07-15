/**
 * @file Payload do job de e-mail de pedido reembolsado.
 * @module modules/notifications/application/types/orderRefundJob
 */

export type OrderRefundJobData = {
  orderId: string;
  userId: string;
  userEmail: string;
  userName: string;
  eventTitle: string;
  totalPriceCents: number;
  ticketsCancelled: number;
};
