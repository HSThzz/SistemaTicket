/**
 * @file Cliente HTTP para emissão manual de ingressos (super admin).
 * @module modules/ticketing/api/adminTicketService
 */

import { api } from "@/shared/api/client";

/** Payload de emissão manual de ingressos. */
export interface IssueManualTicketInput {
  userId: string;
  ticketLotId: string;
  quantity: number;
  sendEmail?: boolean;
  reason?: string;
}

/** Resultado da emissão manual. */
export interface IssueManualTicketResult {
  orderId: string;
  reservationId: string;
  ticketIds: string[];
  ticketsIssued: number;
  emailQueued: boolean;
  eventTitle: string;
  lotName: string;
  userEmail: string;
  userName: string;
}

/**
 * Emite ingressos manualmente para um usuário em um lote específico.
 */
export async function issueManualTicket(
  input: IssueManualTicketInput,
): Promise<IssueManualTicketResult> {
  const { data } = await api.post<{ issue: IssueManualTicketResult; message: string }>(
    "/tickets/admin/issue",
    input,
  );
  return data.issue;
}
