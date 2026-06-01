/**
 * @file Consultas de pedidos do usuário com detalhes de evento e pagamento PIX pendente.
 * @module sales/application/OrderQueryService
 */

import type { DataSource } from "typeorm";
import { Order } from "../../../shared/infrastructure/persistence/entities/Order";
import { OrderStatus } from "../../../shared/kernel/enums";
import type {
  PaymentService,
  PixPaymentDetails,
} from "../../payment/application/PaymentService";

/**
 * Representação resumida de um pedido na listagem do cliente.
 */
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

/**
 * Serviço de leitura de pedidos vinculados ao usuário autenticado.
 */
export class OrderQueryService {
  /**
   * @param dataSource - Conexão TypeORM.
   * @param paymentService - Serviço de pagamento para resolver PIX de pedidos pendentes.
   */
  constructor(
    private readonly dataSource: DataSource,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Lista pedidos do usuário ordenados do mais recente ao mais antigo.
   * @param userId - Identificador do cliente.
   * @returns Lista de pedidos com evento e dados PIX quando o status for pendente.
   */
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
