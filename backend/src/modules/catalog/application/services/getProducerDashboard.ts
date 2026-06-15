import { OrderStatus, TicketStatus, EventStatus } from "../../../../shared/kernel/enums";
import { countTicketsByEventIds } from "../queries/countTicketsByEventIds";
import { findManagedEventsByActor } from "../queries/findManagedEventsByActor";
import { sumRevenueByEventIds } from "../queries/sumRevenueByEventIds";
import type { EventActor, ProducerEventStats } from "../types";

export async function getProducerDashboard(
  actor: EventActor,
) {
  const events = await findManagedEventsByActor(actor);
  const eventIds = events.map((event) => event.id);

  if (eventIds.length === 0) {
    return {
      summary: {
        totalEvents: 0,
        publishedEvents: 0,
        draftEvents: 0,
        ticketsSold: 0,
        ticketsCheckedIn: 0,
        grossRevenueCents: 0,
      },
      events: [],
    };
  }

  const [soldByEvent, checkedInByEvent, revenueByEvent] = await Promise.all([
    countTicketsByEventIds(eventIds, OrderStatus.PAID),
    countTicketsByEventIds(eventIds,
      OrderStatus.PAID,
      TicketStatus.USED,
    ),
    sumRevenueByEventIds(eventIds),
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
        acc.publishedEvents + (event.status === EventStatus.PUBLISHED ? 1 : 0),
      draftEvents: acc.draftEvents + (event.status === EventStatus.DRAFT ? 1 : 0),
      ticketsSold: acc.ticketsSold + event.ticketsSold,
      ticketsCheckedIn: acc.ticketsCheckedIn + event.ticketsCheckedIn,
      grossRevenueCents: acc.grossRevenueCents + event.grossRevenueCents,
    }),
    {
      totalEvents: 0,
      publishedEvents: 0,
      draftEvents: 0,
      ticketsSold: 0,
      ticketsCheckedIn: 0,
      grossRevenueCents: 0,
    },
  );

  return { summary, events: eventStats };
}
