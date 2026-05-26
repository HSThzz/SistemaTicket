import type { DataSource } from "typeorm";
import { Event } from "../entities/Event";
import { Order } from "../entities/Order";
import { Ticket } from "../entities/Ticket";
import { OrderStatus, TicketStatus, UserRole } from "../entities/enums";
import type { EventActor } from "./EventService";

export interface ProducerEventStats {
  eventId: string;
  title: string;
  status: string;
  date: string;
  ticketsSold: number;
  ticketsCheckedIn: number;
  grossRevenueCents: number;
  capacityTotal: number;
  capacityRemaining: number;
}

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

export class EventDashboardService {
  constructor(private readonly dataSource: DataSource) {}

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
