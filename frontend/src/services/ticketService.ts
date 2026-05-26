import { api } from "./api";
import type { TicketListItem } from "../types/api";

export async function listMyTickets(): Promise<TicketListItem[]> {
  const { data } = await api.get<{ tickets: TicketListItem[] }>("/tickets/me");
  return data.tickets;
}
