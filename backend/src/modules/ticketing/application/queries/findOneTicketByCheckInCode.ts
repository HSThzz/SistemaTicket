/**
 * @file Query: busca ingresso por código curto ou uniqueCode legado.
 * @module modules/ticketing/application/queries/findOneTicketByCheckInCode
 */

import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { resolveTicketLookupCodes } from "../../../../shared/kernel/ticketCheckInCode";

export async function findOneTicketByCheckInCode(
  rawCode: string,
): Promise<Ticket | null> {
  const { compactCheckInCode, uniqueCode } = resolveTicketLookupCodes(rawCode);
  const repository = AppDataSource.getRepository(Ticket);

  if (uniqueCode) {
    return repository
      .createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.ticketLot", "ticketLot")
      .leftJoinAndSelect("ticketLot.event", "event")
      .where("ticket.uniqueCode = :uniqueCode", { uniqueCode })
      .getOne();
  }

  return repository
    .createQueryBuilder("ticket")
    .leftJoinAndSelect("ticket.ticketLot", "ticketLot")
    .leftJoinAndSelect("ticketLot.event", "event")
    .where("ticket.checkInCode = :compactCheckInCode", { compactCheckInCode })
    .getOne();
}
