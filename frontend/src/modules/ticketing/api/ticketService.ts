/**
 * @file Cliente HTTP para listagem de ingressos do usuário autenticado.
 * @module modules/ticketing/api/ticketService
 */

import { api } from "@/shared/api/client";
import type { TicketListItem, TicketListPage } from "@/shared/types/api";

export interface ListMyTicketsParams {
  limit?: number;
  cursor?: string;
  status?: "ACTIVE" | "USED" | "CANCELLED";
}

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
 * Busca uma página de ingressos do cliente logado.
 */
export async function fetchMyTicketsPage(
  params: ListMyTicketsParams = {},
): Promise<TicketListPage> {
  const { data } = await api.get<TicketListPage>("/tickets/me", { params });
  return data;
}

/**
 * Lista a primeira página de ingressos, já ordenados por data do evento.
 *
 * @deprecated Prefira {@link fetchMyTicketsPage} para suportar paginação.
 */
export async function listMyTickets(): Promise<TicketListItem[]> {
  const page = await fetchMyTicketsPage();
  return sortTicketsByEventDate(page.tickets);
}
