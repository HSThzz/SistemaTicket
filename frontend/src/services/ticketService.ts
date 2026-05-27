import { api } from "./api";
import type { TicketListItem } from "../types/api";

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

export async function listMyTickets(): Promise<TicketListItem[]> {
  const { data } = await api.get<{ tickets: TicketListItem[] }>("/tickets/me");
  return sortTicketsByEventDate(data.tickets);
}
