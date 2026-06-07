/**
 * @file Consultas de pedidos do usuário com detalhes de evento e pagamento PIX pendente.
 * @module sales/application/OrderQueryService
 */

import type { DataSource } from "typeorm";
import { OrderStatus } from "../../../shared/kernel/enums";
import { OrderNotFoundError } from "../../payment/domain/errors/PaymentError";
import type {
  PaymentService,
  PixPaymentDetails,
} from "../../payment/application/PaymentService";
import { findOneOrderByIdForAdmin } from "./queries/findOneOrderByIdForAdmin";
import { findOrdersByUserId } from "./queries/findOrdersByUserId";

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

/** Detalhes de pedido para painel administrativo. */
export interface OrderAdminDetails extends OrderListItem {
  userId: string;
  userName: string;
  userEmail: string;
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
    const orders = await findOrdersByUserId(this.dataSource, userId);

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

  /**
   * Busca pedido por ID com dados do cliente (admin).
   * @param orderId - UUID do pedido.
   * @throws {OrderNotFoundError} Pedido inexistente.
   */
  async getOrderByIdForAdmin(orderId: string): Promise<OrderAdminDetails> {
    const order = await findOneOrderByIdForAdmin(this.dataSource, orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

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
      userId: order.userId,
      userName: order.user.name,
      userEmail: order.user.email,
    };
  }
}
