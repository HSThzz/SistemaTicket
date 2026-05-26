import type { DataSource } from "typeorm";
import { Order } from "../entities/Order";

export interface OrderListItem {
  id: string;
  status: string;
  totalPrice: number;
  paymentGatewayId: string | null;
  reservationId: string;
}

export class OrderQueryService {
  constructor(private readonly dataSource: DataSource) {}

  async listUserOrders(userId: string): Promise<OrderListItem[]> {
    const orders = await this.dataSource.getRepository(Order).find({
      where: { userId },
      order: { id: "DESC" },
    });

    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      totalPrice: order.totalPrice,
      paymentGatewayId: order.paymentGatewayId,
      reservationId: order.reservationId,
    }));
  }
}

