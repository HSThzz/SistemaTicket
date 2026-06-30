/**
 * @file Cliente HTTP para pedidos do usuário autenticado.
 * @module modules/sales/api/orderService
 */

import { api } from "@/shared/api/client";
import type {
  OrderAdminDetails,
  OrderListItem,
  OrderListPage,
  PixPaymentDetails,
} from "@/shared/types/api";

export interface ListMyOrdersParams {
  limit?: number;
  cursor?: string;
  status?: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
}

/**
 * Busca uma página de pedidos do cliente logado.
 */
export async function fetchMyOrdersPage(
  params: ListMyOrdersParams = {},
): Promise<OrderListPage> {
  const { data } = await api.get<OrderListPage>("/orders/me", { params });
  return data;
}

/**
 * Lista a primeira página de pedidos do cliente logado.
 *
 * @deprecated Prefira {@link fetchMyOrdersPage} para suportar paginação.
 */
export async function listMyOrders(): Promise<OrderListItem[]> {
  const page = await fetchMyOrdersPage();
  return page.orders;
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
