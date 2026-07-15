/**
 * @file Command: atualiza lote com lock pessimista (estoque / preço / nome).
 * @module modules/catalog/application/commands/updateTicketLot
 */

import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export type UpdateTicketLotCommandInput = {
  lotId: string;
  name?: string;
  price?: number;
  totalQuantity?: number;
  /** Incremento de capacidade (apenas se > 0). */
  quantityDelta: number;
  maxPerDocument?: number | null;
};

export type UpdateTicketLotCommandResult = {
  lot: TicketLot;
  quantityDelta: number;
};

/**
 * Persiste alterações no lote sob lock; aumenta available junto com total quando delta > 0.
 */
export async function updateTicketLot(
  input: UpdateTicketLotCommandInput,
): Promise<UpdateTicketLotCommandResult> {
  return AppDataSource.transaction(async (manager) => {
    const lot = await manager.getRepository(TicketLot).findOne({
      where: { id: input.lotId },
      lock: { mode: "pessimistic_write" },
    });

    if (!lot) {
      throw new Error(`Ticket lot ${input.lotId} not found during update`);
    }

    if (input.name !== undefined) {
      lot.name = input.name;
    }

    if (input.price !== undefined) {
      lot.price = input.price;
    }

    if (input.quantityDelta > 0) {
      lot.totalQuantity += input.quantityDelta;
      lot.availableQuantity += input.quantityDelta;
    }

    if (input.maxPerDocument !== undefined) {
      lot.maxPerDocument = input.maxPerDocument;
    }

    const saved = await manager.getRepository(TicketLot).save(lot);
    return { lot: saved, quantityDelta: input.quantityDelta };
  });
}
