import { api } from "../../../shared/api/client";
import type { OrderListItem, PixPaymentDetails } from "../../../types/api";

export async function listMyOrders(): Promise<OrderListItem[]> {
  const { data } = await api.get<{ orders: OrderListItem[] }>("/orders/me");
  return data.orders;
}

export async function getOrderPayment(orderId: string): Promise<PixPaymentDetails> {
  const { data } = await api.get<{ payment: PixPaymentDetails }>(
    `/orders/${orderId}/payment`,
  );
  return data.payment;
}
