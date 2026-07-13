import { Logger } from "../../../../shared/infrastructure/config/logger";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { TicketNotFoundError } from "../../domain/errors/CheckInError";
import { checkInSchema } from "../../validators/schema/checkInSchema";
import { checkInTicket } from "../commands/checkInTicket";
import type { CheckInActor } from "./types";

const CONTEXT = "CheckInService";
const logger = Logger.getInstance();

export async function checkIn(scannedCode: string, actor: CheckInActor) {
  const { uniqueCode: code } = validateSchema(checkInSchema, {
    uniqueCode: scannedCode,
  });

  const result = await checkInTicket(code, actor);

  if (!result) {
    logger.warn(CONTEXT, "Check-in failed — ticket not found", {
      uniqueCode: code,
    });
    throw new TicketNotFoundError();
  }

  logger.info(CONTEXT, "Check-in completed successfully", {
    ticketId: result.ticketId,
    eventTitle: result.eventTitle,
    checkedInAt: result.checkedInAt.toISOString(),
    actorUserId: actor.userId,
  });

  return {
    ownerName: result.ownerName,
    ownerDocument: result.ownerDocument,
    checkedInAt: result.checkedInAt.toISOString(),
    ticketId: result.ticketId,
    eventTitle: result.eventTitle,
  };
}
