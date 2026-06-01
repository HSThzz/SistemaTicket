/**
 * @file Cliente HTTP para listagem de ingressos do usuário autenticado.
 * @module features/ticketing/api/ticketService
 */

import { api } from "../../../shared/api/client";
import type { TicketListItem } from "../../../types/api";

/**
 * Ordena ingressos: futuros primeiro (mais próximos), passados por data decrescente.
 *
 * @param tickets - Lista bruta da API.
 */
export function sortTicketsByEventDate(tickets: TicketListItem[]): TicketListItem[] {
  const now = Date.now();

  return [...tickets].sort((a, b) => {
    const aTime = new Date(a.event.date).getTime();
    const bTime = new Date(b.event.date).getTime();
    const aIsUpcoming = aTime >= now;
    const bIsUpcoming = bTime >= now;

    if (aIsUpcoming !== bIsUpcoming) {
      return aIsUpcoming ? -1 : 1;
    }

    if (aIsUpcoming) {
      return aTime - bTime;
    }

    return bTime - aTime;
  });
}

/**
 * Lista ingressos do cliente logado, já ordenados por data do evento.
 */
export async function listMyTickets(): Promise<TicketListItem[]> {
  const { data } = await api.get<{ tickets: TicketListItem[] }>("/tickets/me");
  return sortTicketsByEventDate(data.tickets);
}
