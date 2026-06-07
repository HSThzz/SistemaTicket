import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import { PAYMENT_CACHE_KEY_PREFIX } from "../../../../shared/infrastructure/config/constants";
import type { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { OrderStatus } from "../../../../shared/kernel/enums";
import type { PaymentGateway } from "../../infrastructure/gateways/PaymentGateway";
import {
  createPaymentGateway,
  isMercadoPagoPixGateway,
} from "../../infrastructure/gateways/createPaymentGateway";
import { updateOrder } from "../commands/updateOrder";
import { buildPixPaymentDetails } from "../helpers/buildPixPaymentDetails";
import { persistPixOnOrder } from "../helpers/persistPixOnOrder";
import type { PixPaymentDetails } from "../types";

export async function resolvePixPaymentDetails(
  dataSource: DataSource,
  redis: Redis | undefined,
  order: Order,
  gateway: PaymentGateway = createPaymentGateway(),
): Promise<PixPaymentDetails | null> {
  if (order.status !== OrderStatus.PENDING) {
    return null;
  }

  if (order.pixCopyPaste && order.pixExpiresAt) {
    return buildPixPaymentDetails(order, {
      transactionId: order.paymentGatewayId ?? "",
      pixCopyPaste: order.pixCopyPaste,
      expiresAt: order.pixExpiresAt,
    });
  }

  if (redis) {
    const cached = await redis.get(
      `${PAYMENT_CACHE_KEY_PREFIX}${order.reservationId}`,
    );

    if (cached) {
      const parsed = JSON.parse(cached) as PixPaymentDetails;
      await persistPixOnOrder(dataSource, order.id, parsed);
      return parsed;
    }
  }

  if (order.paymentGatewayId && isMercadoPagoPixGateway(gateway)) {
    const recovered = await gateway.getPixCopyPaste(order.paymentGatewayId);

    if (recovered) {
      order.pixCopyPaste = recovered.pixCopyPaste;
      order.pixExpiresAt = recovered.expiresAt;
      await updateOrder(dataSource, order);

      return buildPixPaymentDetails(order, {
        transactionId: order.paymentGatewayId,
        pixCopyPaste: recovered.pixCopyPaste,
        expiresAt: recovered.expiresAt,
      });
    }
  }

  return null;
}
