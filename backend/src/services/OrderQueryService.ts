import type { DataSource } from "typeorm";
import { Order } from "../entities/Order";
import { OrderStatus } from "../entities/enums";
import type { PixPaymentDetails } from "./PaymentService";
import type { PaymentService } from "./PaymentService";

export interface OrderListItem {
  id: string;
  status: string;
  totalPrice: number;
  paymentGatewayId: string | null;
  reservationId: string;
  eventId: string | null;
  eventTitle: string | null;
  payment: PixPaymentDetails | null;
}

export class OrderQueryService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly paymentService: PaymentService,
  ) {}

  async listUserOrders(userId: string): Promise<OrderListItem[]> {
    const orders = await this.dataSource.getRepository(Order).find({
      where: { userId },
      relations: {
        reservation: {
          ticketLot: {
            event: true,
          },
        },
      },
      order: { id: "DESC" },
    });

    return Promise.all(
      orders.map(async (order) => {
        const event = order.reservation?.ticketLot?.event;
        const payment =
          order.status === OrderStatus.PENDING
            ? await this.paymentService.resolvePixPaymentDetails(order)
            : null;

        return {
          id: order.id,
          status: order.status,
          totalPrice: order.totalPrice,
          paymentGatewayId: order.paymentGatewayId,
          reservationId: order.reservationId,
          eventId: event?.id ?? null,
          eventTitle: event?.title ?? null,
          payment,
        };
      }),
    );
  }
}
