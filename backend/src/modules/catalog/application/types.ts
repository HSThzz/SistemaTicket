/**
 * @file Tipos compartilhados do módulo de catálogo.
 * @module modules/catalog/application/types
 */

import type { UserRole } from "../../../shared/kernel/enums";

export type { CreateEventInputSchema } from "../validators/schema/createEventSchema";
export type { CreateTicketLotInputSchema } from "../validators/schema/createTicketLotSchema";
export type { UpdateEventInputSchema } from "../validators/schema/updateEventSchema";

/** Ator autenticado que executa operações sobre eventos. */
export interface EventActor {
  userId: string;
  role: UserRole;
}

/** Métricas agregadas por evento no painel do produtor. */
export interface ProducerEventStats {
  eventId: string;
  title: string;
  status: string;
  type: string;
  date: string;
  imageUrl: string | null;
  ticketsSold: number;
  ticketsCheckedIn: number;
  grossRevenueCents: number;
  capacityTotal: number;
  capacityRemaining: number;
}

/** Resposta completa do dashboard com resumo e lista por evento. */
export interface ProducerDashboardStats {
  summary: {
    totalEvents: number;
    publishedEvents: number;
    draftEvents: number;
    ticketsSold: number;
    ticketsCheckedIn: number;
    grossRevenueCents: number;
  };
  events: ProducerEventStats[];
}
