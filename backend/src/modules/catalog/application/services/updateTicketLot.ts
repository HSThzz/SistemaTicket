/**
 * @file Serviço: edição segura de lote (nome, preço sem atividade, só aumento de estoque).
 * @module modules/catalog/application/services/updateTicketLot
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import {
  EventNotFoundError,
  TicketLotNotFoundError,
  TicketLotPriceLockedError,
  TicketLotQuantityDecreaseForbiddenError,
} from "../../domain/errors/EventError";
import { eventLotParamsSchema } from "../../validators/schema/eventIdSchema";
import {
  updateTicketLotSchema,
  type UpdateTicketLotInputSchema,
} from "../../validators/schema/updateTicketLotSchema";
import { updateTicketLot as updateTicketLotCommand } from "../commands/updateTicketLot";
import { assertCanManageEvent } from "../helpers/assertCanManageEvent";
import { assertEventIsActive } from "../helpers/assertEventIsActive";
import { assertEventAllowsNewLots } from "../helpers/assertEventMutable";
import { countPendingReservationsByLotId } from "../queries/countPendingReservationsByLotId";
import { countTicketsByLotId } from "../queries/countTicketsByLotId";
import { findOneEventById } from "../queries/findOneEventById";
import { findOneTicketLotByEvent } from "../queries/findOneTicketLotByEvent";
import type { EventActor } from "../types";

const CONTEXT = "updateTicketLot";

export type UpdateTicketLotResult = {
  lot: Awaited<ReturnType<typeof updateTicketLotCommand>>["lot"];
  quantityDelta: number;
};

export async function updateTicketLot(
  eventId: string,
  lotId: string,
  input: UpdateTicketLotInputSchema,
  actor: EventActor,
): Promise<UpdateTicketLotResult> {
  const params = validateSchema(eventLotParamsSchema, { eventId, lotId });
  const data = validateSchema(updateTicketLotSchema, input);

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

  let quantityDelta = 0;

  if (data.totalQuantity !== undefined) {
    if (data.totalQuantity < lot.totalQuantity) {
      throw new TicketLotQuantityDecreaseForbiddenError();
    }
    quantityDelta = data.totalQuantity - lot.totalQuantity;
  }

  if (data.price !== undefined && data.price !== lot.price) {
    const [ticketCount, pendingReservations] = await Promise.all([
      countTicketsByLotId(lot.id),
      countPendingReservationsByLotId(lot.id),
    ]);

    if (ticketCount > 0 || pendingReservations > 0) {
      throw new TicketLotPriceLockedError();
    }
  }

  const result = await updateTicketLotCommand({
    lotId: lot.id,
    name: data.name,
    price: data.price,
    quantityDelta,
  });

  Logger.getInstance().info(CONTEXT, "Ticket lot updated", {
    ticketLotId: result.lot.id,
    eventId: event.id,
    actorUserId: actor.userId,
    quantityDelta: result.quantityDelta,
    nameChanged: data.name !== undefined,
    priceChanged: data.price !== undefined && data.price !== lot.price,
  });

  return result;
}
