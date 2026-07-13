/**
 * @file Command: pré-visualiza ingresso para check-in sem marcar como usado.
 * @module modules/ticketing/application/commands/previewCheckInTicket
 */

import type { Prettify } from "../../../../shared/kernel/prettify";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { loadTicketForCheckIn } from "../helpers/loadTicketForCheckIn";
import type { CheckInActor } from "../services/types";

export type PreviewCheckInTicketResult = Prettify<{
  ownerName: string;
  ownerDocument: string;
  ticketId: string;
  eventTitle: string;
  lotName: string;
  lotPrice: number;
}>;

/**
 * Mesmas validações do check-in, sem alterar o status do ingresso.
 */
export async function previewCheckInTicket(
  scannedCode: string,
  actor: CheckInActor,
): Promise<PreviewCheckInTicketResult | null> {
  return AppDataSource.transaction(async (manager) => {
    const ready = await loadTicketForCheckIn(manager, scannedCode, actor, {
      lockForUpdate: false,
    });

    if (!ready) {
      return null;
    }

    const { ticket, event, lot } = ready;

    return {
      ownerName: ticket.ownerName,
      ownerDocument: ticket.ownerDocument,
      ticketId: ticket.id,
      eventTitle: event.title,
      lotName: lot.name,
      lotPrice: lot.price,
    };
  });
}
