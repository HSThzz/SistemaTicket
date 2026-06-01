/**
 * @file Serviço de estatísticas do painel do produtor (dashboard).
 * @module modules/catalog/application/EventDashboardService
 */

import type { DataSource } from "typeorm";
import { Event } from "../../../shared/infrastructure/persistence/entities/Event";
import { Order } from "../../../shared/infrastructure/persistence/entities/Order";
import { Ticket } from "../../../shared/infrastructure/persistence/entities/Ticket";
import { OrderStatus, TicketStatus, UserRole } from "../../../shared/kernel/enums";
import type { EventActor } from "./EventService";

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
    const events = await this.loadManagedEvents(actor);
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
      this.countTicketsByEvent(eventIds, OrderStatus.PAID),
      this.countTicketsByEvent(eventIds, OrderStatus.PAID, TicketStatus.USED),
      this.sumRevenueByEvent(eventIds),
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

  /** Lista eventos visíveis ao ator com lotes carregados. */
  private async loadManagedEvents(actor: EventActor): Promise<Event[]> {
    const repository = this.dataSource.getRepository(Event);

    if (actor.role === UserRole.ADMIN) {
      return repository.find({
        order: { date: "ASC" },
        relations: { ticketLots: true },
      });
    }

    return repository.find({
      where: { producerId: actor.userId },
      order: { date: "ASC" },
      relations: { ticketLots: true },
    });
  }

  /**
   * Conta ingressos por evento conforme status de pedido e opcionalmente de ticket.
   * @param eventIds - IDs dos eventos.
   * @param orderStatus - Status do pedido exigido.
   * @param ticketStatus - Status do ingresso opcional.
   * @returns Mapa eventId → quantidade.
   */
  private async countTicketsByEvent(
    eventIds: string[],
    orderStatus: OrderStatus,
    ticketStatus?: TicketStatus,
  ): Promise<Map<string, number>> {
    const qb = this.dataSource
      .getRepository(Ticket)
      .createQueryBuilder("ticket")
      .innerJoin("ticket.order", "order")
      .innerJoin("ticket.ticketLot", "lot")
      .innerJoin("lot.event", "event")
      .select("event.id", "eventId")
      .addSelect("COUNT(ticket.id)", "count")
      .where("event.id IN (:...eventIds)", { eventIds })
      .andWhere("order.status = :orderStatus", { orderStatus })
      .groupBy("event.id");

    if (ticketStatus) {
      qb.andWhere("ticket.status = :ticketStatus", { ticketStatus });
    }

    const rows = await qb.getRawMany<{ eventId: string; count: string }>();
    return new Map(rows.map((row) => [row.eventId, Number(row.count)]));
  }

  /**
   * Soma receita bruta (centavos) de pedidos pagos por evento.
   * @param eventIds - IDs dos eventos.
   * @returns Mapa eventId → receita em centavos.
   */
  private async sumRevenueByEvent(eventIds: string[]): Promise<Map<string, number>> {
    const rows = await this.dataSource
      .getRepository(Order)
      .createQueryBuilder("order")
      .innerJoin("order.tickets", "ticket")
      .innerJoin("ticket.ticketLot", "lot")
      .innerJoin("lot.event", "event")
      .select("event.id", "eventId")
      .addSelect("SUM(DISTINCT order.totalPrice)", "revenue")
      .where("event.id IN (:...eventIds)", { eventIds })
      .andWhere("order.status = :status", { status: OrderStatus.PAID })
      .groupBy("event.id")
      .getRawMany<{ eventId: string; revenue: string }>();

    return new Map(rows.map((row) => [row.eventId, Number(row.revenue)]));
  }
}
