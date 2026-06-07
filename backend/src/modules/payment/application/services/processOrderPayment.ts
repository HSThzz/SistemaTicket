import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import {
  PAYMENT_CACHE_KEY_PREFIX,
  RESERVATION_TTL_SECONDS,
} from "../../../../shared/infrastructure/config/constants";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { OrderNotFoundError } from "../../domain/errors/PaymentError";
import type { PaymentGateway } from "../../infrastructure/gateways/PaymentGateway";
import { createPaymentGateway } from "../../infrastructure/gateways/createPaymentGateway";
import { updateOrder } from "../commands/updateOrder";
import { findOneOrderByIdWithPaymentRelations } from "../queries/findOneOrderByIdWithPaymentRelations";
import { buildPixPaymentDetails } from "../helpers/buildPixPaymentDetails";
import type { PixPaymentDetails } from "../types";

const CONTEXT = "PaymentService";
const logger = Logger.getInstance();

export async function processOrderPayment(
  dataSource: DataSource,
  redis: Redis | undefined,
  orderId: string,
  gateway: PaymentGateway = createPaymentGateway(),
): Promise<PixPaymentDetails> {
  logger.info(CONTEXT, "Starting PIX charge creation", { orderId });

  const order = await findOneOrderByIdWithPaymentRelations(dataSource, orderId);

  if (!order?.user) {
    throw new OrderNotFoundError(orderId);
  }

  const charge = await gateway.createPixCharge({
    orderId: order.id,
    amountCents: order.totalPrice,
    description: `Ingressos pedido ${order.id.slice(0, 8)}`,
    payerEmail: order.user.email,
    payerFirstName: order.user.name.split(" ")[0] ?? order.user.name,
    payerDocument: order.user.document,
  });

  order.paymentGatewayId = charge.transactionId;
  order.pixCopyPaste = charge.pixCopyPaste;
  order.pixExpiresAt = charge.expiresAt;
  await updateOrder(dataSource, order);

  logger.info(CONTEXT, "PIX charge created", {
    orderId: order.id,
    transactionId: charge.transactionId,
    amountCents: order.totalPrice,
    expiresAt: charge.expiresAt.toISOString(),
  });

  const details = buildPixPaymentDetails(order, charge);

  if (redis) {
    await redis.setex(
      `${PAYMENT_CACHE_KEY_PREFIX}${order.reservationId}`,
      RESERVATION_TTL_SECONDS,
      JSON.stringify(details),
    );
  }

  return details;
}
