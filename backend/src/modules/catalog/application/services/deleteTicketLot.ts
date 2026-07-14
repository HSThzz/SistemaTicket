/**
 * @file Serviço: produtor remove lote de ingressos sem atividade comercial.
 * @module modules/catalog/application/services/deleteTicketLot
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { EventStatus } from "../../../../shared/kernel/enums";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import {
  EventNotFoundError,
  TicketLotHasPendingReservationsError,
  TicketLotHasSalesError,
  TicketLotLastPublishedError,
  TicketLotNotFoundError,
} from "../../domain/errors/EventError";
import { eventLotParamsSchema } from "../../validators/schema/eventIdSchema";
import { deleteTicketLot as deleteTicketLotCommand } from "../commands/deleteTicketLot";
import { assertCanManageEvent } from "../helpers/assertCanManageEvent";
import { assertEventIsActive } from "../helpers/assertEventIsActive";
import { assertEventAllowsNewLots } from "../helpers/assertEventMutable";
import { countPendingReservationsByLotId } from "../queries/countPendingReservationsByLotId";
import { countTicketLotsByEventId } from "../queries/countTicketLotsByEventId";
import { countTicketsByLotId } from "../queries/countTicketsByLotId";
import { findOneEventById } from "../queries/findOneEventById";
import { findOneTicketLotByEvent } from "../queries/findOneTicketLotByEvent";
import type { EventActor } from "../types";

const CONTEXT = "deleteTicketLot";

export async function deleteTicketLot(
  eventId: string,
  lotId: string,
  actor: EventActor,
): Promise<void> {
  const params = validateSchema(eventLotParamsSchema, { eventId, lotId });

  const event = await findOneEventById(params.eventId);
  if (!event) {
    throw new EventNotFoundError(params.eventId);
  }

  assertCanManageEvent(event, actor);
  assertEventIsActive(event);
  assertEventAllowsNewLots(event);

  const lot = await findOneTicketLotByEvent(params.eventId, params.lotId);
  if (!lot) {
    throw new TicketLotNotFoundError(params.lotId);
  }

  const ticketCount = await countTicketsByLotId(lot.id);
  if (ticketCount > 0) {
    throw new TicketLotHasSalesError();
  }

  const pendingReservations = await countPendingReservationsByLotId(lot.id);
  if (pendingReservations > 0) {
    throw new TicketLotHasPendingReservationsError();
  }

  if (event.status === EventStatus.PUBLISHED) {
    const lotCount = await countTicketLotsByEventId(event.id);
    if (lotCount <= 1) {
      throw new TicketLotLastPublishedError();
    }
  }

  await deleteTicketLotCommand(lot);

  Logger.getInstance().info(CONTEXT, "Ticket lot deleted", {
    ticketLotId: lot.id,
    eventId: event.id,
    actorUserId: actor.userId,
  });
}
