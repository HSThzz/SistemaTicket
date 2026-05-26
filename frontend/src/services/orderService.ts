import { api } from "./api";
import type { OrderListItem } from "../types/api";

export async function listMyOrders(): Promise<OrderListItem[]> {
  const { data } = await api.get<{ orders: OrderListItem[] }>("/orders/me");
  return data.orders;
}
