/**
 * @file Schema Zod do job de entrega de ingressos.
 * @module modules/notifications/validators/schema/ticketDeliveryJobSchema
 */

import { z } from "zod";
import { uuidSchema } from "../../../../shared/kernel/zodFields";

export const ticketDeliveryJobSchema = z.object({
  orderId: uuidSchema,
  userId: uuidSchema,
  userEmail: z.string().trim().email().max(255),
  userName: z.string().trim().min(1).max(255),
  ticketIds: z.array(uuidSchema).min(1),
});

export type TicketDeliveryJobSchema = z.infer<typeof ticketDeliveryJobSchema>;
