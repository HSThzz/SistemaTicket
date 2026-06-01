/**
 * @file Contratos TypeScript das respostas e entidades da API REST.
 * @module types/api
 */

/** Papéis de usuário suportados pelo sistema. */
export type UserRole = "CLIENT" | "PRODUCER" | "ADMIN";

/** Perfil público do usuário autenticado. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/** Resposta de login ou cadastro com token e usuário. */
export interface AuthResponse {
  token: string;
  user: AuthUser;
}

/** Lote de ingressos de um evento com preço e estoque. */
export interface TicketLot {
  id: string;
  name: string;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
}

/** Status de publicação e ciclo de vida de um evento. */
export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "FINISHED";

/** Evento com metadados, local, data e lotes associados. */
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

/**
 * Fase do fluxo de reserva/compra monitorada pelo frontend.
 * Reflete o estado no Redis, fila e PostgreSQL.
 */
export type ReservationPhase =
  | "PENDING_PERSISTENCE"
  | "PENDING_PAYMENT"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "EXPIRED"
  | "FAILED"
  | "NOT_FOUND";

/** Dados do pagamento PIX vinculado a um pedido. */
export interface PixPaymentDetails {
  orderId: string;
  transactionId: string;
  pixCopyPaste: string;
  expiresAt: string;
  amountCents: number;
}

/** Visão consolidada do status de uma reserva durante o checkout. */
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

/** Resposta imediata após reservar ingressos de um lote. */
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

/** Ingresso do usuário com evento, lote e pedido aninhados. */
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

/** Pedido listado na área do cliente com resumo do evento e PIX opcional. */
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

/** Métricas de vendas e check-in de um evento no painel do produtor. */
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

/** Resumo agregado do dashboard do produtor e lista por evento. */
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

/** Corpo de erro padronizado retornado pela API. */
export interface ApiErrorBody {
  error?: string;
  code?: string;
}
