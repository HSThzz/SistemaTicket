export type UserRole = "CLIENT" | "PRODUCER" | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface TicketLot {
  id: string;
  name: string;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
}

export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "FINISHED";

export interface Event {
  id: string;
  producerId: string;
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl: string | null;
  status: EventStatus | string;
  ticketLots: TicketLot[];
}

export type ReservationPhase =
  | "PENDING_PERSISTENCE"
  | "PENDING_PAYMENT"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "EXPIRED"
  | "FAILED"
  | "NOT_FOUND";

export interface PixPaymentDetails {
  orderId: string;
  transactionId: string;
  pixCopyPaste: string;
  expiresAt: string;
  amountCents: number;
}

export interface ReservationStatusView {
  reservationId: string;
  phase: ReservationPhase;
  reservation: {
    id: string;
    status: string;
    expiresAt: string;
    quantity: number;
    ticketLotId: string;
  } | null;
  order: {
    id: string;
    status: string;
    totalPrice: number;
    paymentGatewayId: string | null;
  } | null;
  payment: PixPaymentDetails | null;
  meta: {
    inRedis: boolean;
    persistedToPostgres: boolean;
    queuePendingJobs: number;
  };
}

export interface ReserveTicketsResponse {
  reservation: {
    id: string;
    status: string;
    expiresAt: string;
    quantity: number;
    ticketLotId: string;
  };
  stock: {
    remaining: number;
  };
}

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

export interface OrderListItem {
  id: string;
  status: string;
  totalPrice: number;
  paymentGatewayId: string | null;
  reservationId: string;
  eventId: string | null;
  eventTitle: string | null;
  payment: PixPaymentDetails | null;
}

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

export interface ApiErrorBody {
  error?: string;
  code?: string;
}
