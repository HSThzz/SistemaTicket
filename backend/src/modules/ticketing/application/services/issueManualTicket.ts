/**
 * @file Serviço: emissão manual de ingressos exclusiva para super admin.
 * @module modules/ticketing/application/services/issueManualTicket
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { AdminAuditAction, UserRole } from "../../../../shared/kernel/enums";
import { isSuperAdmin } from "../../../../shared/kernel/staffRoles";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { createAdminAuditLog } from "../../../identity/application/commands/createAdminAuditLog";
import { enqueueTicketDelivery } from "../../../notifications/application/commands/enqueueTicketDelivery";
import { ManualTicketForbiddenError } from "../../domain/errors/ManualTicketError";
import {
  issueManualTicketSchema,
  type IssueManualTicketInputSchema,
} from "../../validators/schema/issueManualTicketSchema";
import { issueManualTickets } from "../commands/issueManualTickets";

const CONTEXT = "IssueManualTicket";
const logger = Logger.getInstance();

export interface IssueManualTicketActor {
  userId: string;
  role: UserRole;
}

export async function issueManualTicket(
  input: IssueManualTicketInputSchema,
  actor: IssueManualTicketActor,
) {
  if (!isSuperAdmin(actor.role)) {
    throw new ManualTicketForbiddenError();
  }

  const data = validateSchema(issueManualTicketSchema, input);

  const issued = await issueManualTickets({
    userId: data.userId,
    ticketLotId: data.ticketLotId,
    quantity: data.quantity,
  });

  let emailQueued = false;

  if (data.sendEmail) {
    await enqueueTicketDelivery({
      id: issued.orderId,
      ticketIds: issued.ticketIds,
    });
    emailQueued = true;
  }

  await createAdminAuditLog({
    actorUserId: actor.userId,
    action: AdminAuditAction.TICKETS_ISSUED_MANUALLY,
    targetType: "order",
    targetId: issued.orderId,
    metadata: {
      userId: data.userId,
      userEmail: issued.userEmail,
      userName: issued.userName,
      ticketLotId: data.ticketLotId,
      lotName: issued.lotName,
      eventId: issued.eventId,
      eventTitle: issued.eventTitle,
      quantity: data.quantity,
      sendEmail: data.sendEmail,
      emailQueued,
      reason: data.reason ?? null,
      ticketIds: issued.ticketIds,
    },
  });

  logger.info(CONTEXT, "Manual ticket issue completed", {
    actorUserId: actor.userId,
    orderId: issued.orderId,
    emailQueued,
  });

  return {
    orderId: issued.orderId,
    reservationId: issued.reservationId,
    ticketIds: issued.ticketIds,
    ticketsIssued: issued.ticketsIssued,
    emailQueued,
    eventTitle: issued.eventTitle,
    lotName: issued.lotName,
    userEmail: issued.userEmail,
    userName: issued.userName,
  };
}
