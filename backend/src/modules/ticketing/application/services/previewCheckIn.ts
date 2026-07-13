/**
 * @file Serviço: pré-visualização de ingresso na portaria.
 * @module modules/ticketing/application/services/previewCheckIn
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { TicketNotFoundError } from "../../domain/errors/CheckInError";
import { checkInSchema } from "../../validators/schema/checkInSchema";
import { previewCheckInTicket } from "../commands/previewCheckInTicket";
import type { CheckInActor, CheckInPreviewResult } from "./types";

const CONTEXT = "PreviewCheckInService";
const logger = Logger.getInstance();

export async function previewCheckIn(
  scannedCode: string,
  actor: CheckInActor,
): Promise<CheckInPreviewResult> {
  const { uniqueCode: code } = validateSchema(checkInSchema, {
    uniqueCode: scannedCode,
  });

  const result = await previewCheckInTicket(code, actor);

  if (!result) {
    logger.warn(CONTEXT, "Check-in preview failed — ticket not found", {
      uniqueCode: code,
    });
    throw new TicketNotFoundError();
  }

  logger.info(CONTEXT, "Check-in preview ready", {
    ticketId: result.ticketId,
    eventTitle: result.eventTitle,
    lotName: result.lotName,
    actorUserId: actor.userId,
  });

  return {
    ownerName: result.ownerName,
    ownerDocument: result.ownerDocument,
    ticketId: result.ticketId,
    eventTitle: result.eventTitle,
    lotName: result.lotName,
    lotPrice: result.lotPrice,
  };
}
