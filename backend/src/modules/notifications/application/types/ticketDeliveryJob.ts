/**
 * @file Payload tipado do job de entrega de ingressos.
 * @module modules/notifications/application/types/ticketDeliveryJob
 */

import type { Prettify } from "../../../../shared/kernel/prettify";

export type TicketDeliveryJobData = Prettify<{
  orderId: string;
  userId: string;
  userEmail: string;
  userName: string;
  ticketIds: string[];
}>;
