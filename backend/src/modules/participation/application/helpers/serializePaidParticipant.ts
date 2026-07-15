/**
 * @file Serializa participante pago para resposta JSON da API.
 * @module modules/participation/application/helpers/serializePaidParticipant
 */

import type { PaidParticipantRow } from "../queries/findPaidParticipantsByEventId";

export function serializePaidParticipant(row: PaidParticipantRow) {
  return {
    orderId: row.orderId,
    userId: row.userId,
    name: row.name,
    email: row.email,
    instagramHandle: row.instagramHandle,
    ticketCount: row.ticketCount,
    totalPriceCents: row.totalPriceCents,
    paidAt: row.paidAt.toISOString(),
    ticketLotId: row.ticketLotId,
    ticketLotName: row.ticketLotName,
  };
}
