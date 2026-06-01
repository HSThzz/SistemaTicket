/**
 * @file Cliente HTTP para pedidos do usuário autenticado.
 * @module features/sales/api/orderService
 */

import { api } from "../../../shared/api/client";
import type { OrderListItem, PixPaymentDetails } from "../../../types/api";

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
