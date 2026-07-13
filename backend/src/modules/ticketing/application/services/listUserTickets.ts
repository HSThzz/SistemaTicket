import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { userIdSchema } from "../../../identity/validators/schema/userIdSchema";
import { listUserTicketsQuerySchema } from "../../validators/schema/listUserTicketsQuerySchema";
import { findManyTicketsByUserId } from "../queries/findManyTicketsByUserId";

export interface TicketListItem {
  id: string;
  status: string;
  /** Código curto para QR / portaria. */
  checkInCode: string;
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

export interface ListUserTicketsResult {
  tickets: TicketListItem[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

function mapTicketToListItem(
  ticket: Awaited<ReturnType<typeof findManyTicketsByUserId>>["tickets"][number],
): TicketListItem {
  return {
    id: ticket.id,
    status: ticket.status,
    checkInCode: ticket.checkInCode,
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
  };
}

export async function listUserTickets(
  userId: string,
  query: unknown = {},
): Promise<ListUserTicketsResult> {
  const id = validateSchema(userIdSchema, userId);
  const pagination = validateSchema(listUserTicketsQuerySchema, query);
  const filters = pagination.status ? { status: pagination.status } : undefined;

  const { tickets, hasNextPage, nextCursor } = await findManyTicketsByUserId({
    userId: id,
    limit: pagination.limit,
    cursor: pagination.cursor,
    filters,
  });

  return {
    tickets: tickets.map(mapTicketToListItem),
    nextCursor,
    hasNextPage,
  };
}
