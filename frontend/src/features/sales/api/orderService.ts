/**
 * @file Cliente HTTP para pedidos do usuário autenticado.
 * @module features/sales/api/orderService
 */

import { api } from "../../../shared/api/client";
import type { OrderAdminDetails, OrderListItem, PixPaymentDetails } from "../../../types/api";

/**
 * Lista pedidos do cliente logado.
 */
export async function listMyOrders(): Promise<OrderListItem[]> {
  const { data } = await api.get<{ orders: OrderListItem[] }>("/orders/me");
  return data.orders;
}

/**
 * Recupera dados PIX de um pedido pendente.
 *
 * @param orderId - Identificador do pedido.
 */
export async function getOrderPayment(orderId: string): Promise<PixPaymentDetails> {
  const { data } = await api.get<{ payment: PixPaymentDetails }>(
    `/orders/${orderId}/payment`,
  );
  return data.payment;
}

/** Consulta pedido por ID (admin). */
export async function getOrderByIdAdmin(orderId: string): Promise<OrderAdminDetails> {
  const { data } = await api.get<{ order: OrderAdminDetails }>(`/orders/${orderId}`);
  return data.order;
}

/** Reembolsa pedido pago (admin). */
export async function refundOrder(orderId: string): Promise<{
  orderId: string;
  ticketsCancelled: number;
  stockRestored: number;
}> {
  const { data } = await api.post<{
    refund: { orderId: string; ticketsCancelled: number; stockRestored: number };
  }>(`/orders/${orderId}/refund`);
  return data.refund;
}
