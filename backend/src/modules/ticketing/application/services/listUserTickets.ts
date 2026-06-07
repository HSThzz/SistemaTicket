import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { userIdSchema } from "../../../identity/validators/schema/userIdSchema";
import { findTicketsByUserId } from "../queries/findTicketsByUserId";

export interface TicketListItem {
  id: string;
  status: string;
  uniqueCode: string;
  checkedInAt: string | null;
  event: {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    status: string;
    imageUrl: string | null;
  };
  ticketLot: {
    id: string;
    name: string;
    price: number;
  };
  order: {
    id: string;
    status: string;
    totalPrice: number;
  };
}

export async function listUserTickets(
  userId: string,
) {
  const id = validateSchema(userIdSchema, userId);
  const tickets = await findTicketsByUserId(id);

  return tickets.map((ticket) => ({
    id: ticket.id,
    status: ticket.status,
    uniqueCode: ticket.uniqueCode,
    checkedInAt: ticket.checkedInAt ? ticket.checkedInAt.toISOString() : null,
    event: {
      id: ticket.ticketLot.event.id,
      title: ticket.ticketLot.event.title,
      description: ticket.ticketLot.event.description,
      date: ticket.ticketLot.event.date.toISOString(),
      location: ticket.ticketLot.event.location,
      status: ticket.ticketLot.event.status,
      imageUrl: ticket.ticketLot.event.imageUrl,
    },
    ticketLot: {
      id: ticket.ticketLot.id,
      name: ticket.ticketLot.name,
      price: ticket.ticketLot.price,
    },
    order: {
      id: ticket.order.id,
      status: ticket.order.status,
      totalPrice: ticket.order.totalPrice,
    },
  }));
}
