/**
 * @file Serviço de estatísticas do painel do produtor (dashboard).
 * @module modules/catalog/application/EventDashboardService
 */

import type { DataSource } from "typeorm";
import { OrderStatus, TicketStatus } from "../../../shared/kernel/enums";
import type { EventActor } from "./types";
import { countTicketsByEventIds } from "./queries/countTicketsByEventIds";
import { findManagedEventsByActor } from "./queries/findManagedEventsByActor";
import { sumRevenueByEventIds } from "./queries/sumRevenueByEventIds";

/** Métricas agregadas por evento no painel do produtor. */
export interface ProducerEventStats {
  eventId: string;
  title: string;
  status: string;
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
    ticketsSold: number;
    ticketsCheckedIn: number;
    grossRevenueCents: number;
  };
  events: ProducerEventStats[];
}

/**
 * Calcula vendas, check-ins, receita e capacidade dos eventos gerenciados pelo ator.
 */
export class EventDashboardService {
  /**
   * @param dataSource - Fonte de dados TypeORM.
   */
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Monta dashboard com totais e detalhamento por evento.
   * @param actor - Produtor ou admin autenticado.
   * @returns Estatísticas resumidas e por evento.
   */
  async getProducerDashboard(actor: EventActor): Promise<ProducerDashboardStats> {
    const events = await findManagedEventsByActor(this.dataSource, actor);
    const eventIds = events.map((event) => event.id);

    if (eventIds.length === 0) {
      return {
        summary: {
          totalEvents: 0,
          publishedEvents: 0,
          ticketsSold: 0,
          ticketsCheckedIn: 0,
          grossRevenueCents: 0,
        },
        events: [],
      };
    }

    const [soldByEvent, checkedInByEvent, revenueByEvent] = await Promise.all([
      countTicketsByEventIds(this.dataSource, eventIds, OrderStatus.PAID),
      countTicketsByEventIds(
        this.dataSource,
        eventIds,
        OrderStatus.PAID,
        TicketStatus.USED,
      ),
      sumRevenueByEventIds(this.dataSource, eventIds),
    ]);

    const eventStats: ProducerEventStats[] = events.map((event) => {
      const capacityTotal = event.ticketLots.reduce(
        (sum, lot) => sum + lot.totalQuantity,
        0,
      );
      const capacityRemaining = event.ticketLots.reduce(
        (sum, lot) => sum + lot.availableQuantity,
        0,
      );

      return {
        eventId: event.id,
        title: event.title,
        status: event.status,
        date: event.date.toISOString(),
        imageUrl: event.imageUrl,
        ticketsSold: soldByEvent.get(event.id) ?? 0,
        ticketsCheckedIn: checkedInByEvent.get(event.id) ?? 0,
        grossRevenueCents: revenueByEvent.get(event.id) ?? 0,
        capacityTotal,
        capacityRemaining,
      };
    });

    const summary = eventStats.reduce(
      (acc, event) => ({
        totalEvents: acc.totalEvents + 1,
        publishedEvents:
          acc.publishedEvents + (event.status === "PUBLISHED" ? 1 : 0),
        ticketsSold: acc.ticketsSold + event.ticketsSold,
        ticketsCheckedIn: acc.ticketsCheckedIn + event.ticketsCheckedIn,
        grossRevenueCents: acc.grossRevenueCents + event.grossRevenueCents,
      }),
      {
        totalEvents: 0,
        publishedEvents: 0,
        ticketsSold: 0,
        ticketsCheckedIn: 0,
        grossRevenueCents: 0,
      },
    );

    return { summary, events: eventStats };
  }
}
