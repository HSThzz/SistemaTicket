/**
 * @file Contratos TypeScript das respostas e entidades da API REST.
 * @module types/api
 */

/** Papéis de usuário suportados pelo sistema. */
export type UserRole = "CLIENT" | "PRODUCER" | "ADMIN" | "SUPER_ADMIN";

/** Perfil público do usuário autenticado. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** CPF (apenas dígitos); retornado por `/auth/me`. */
  document?: string;
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

/** Visibilidade do evento e fluxo de aquisição de ingressos. */
export type EventType = "PUBLIC" | "PRIVATE";

/** Evento com metadados, local, data e lotes associados. */
export interface Event {
  id: string;
  producerId: string;
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl: string | null;
  artists?: string[];
  status: EventStatus | string;
  type: EventType | string;
  ticketLots: TicketLot[];
  /** Solicitações pendentes (resposta do painel do produtor). */
  pendingParticipationCount?: number;
}

/** Status de uma solicitação de participação em evento privado. */
export type ParticipationRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Solicitação de participação em um evento privado. */
export interface ParticipationRequest {
  id: string;
  eventId: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string | null;
  status: ParticipationRequestStatus | string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
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
  /** Código curto para QR / portaria. */
  checkInCode: string;
  /** Legado: ausente nas listagens novas. */
  uniqueCode?: string;
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

/** Resposta paginada da listagem de ingressos do usuário. */
export interface TicketListPage {
  tickets: TicketListItem[];
  nextCursor: string | null;
  hasNextPage: boolean;
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

/** Resposta paginada da listagem de pedidos do usuário. */
export interface OrderListPage {
  orders: OrderListItem[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

/** Pedido com dados do cliente (painel admin). */
export interface OrderAdminDetails extends OrderListItem {
  userId: string;
  userName: string;
  userEmail: string;
}

/** Métricas de vendas e check-in de um evento no painel do produtor. */
export interface ProducerEventStats {
  eventId: string;
  title: string;
  status: string;
  type: EventType | string;
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
    draftEvents: number;
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

/** Registro de auditoria de ações administrativas sensíveis. */
export interface AdminAuditLogEntry {
  id: string;
  actorUserId: string;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

/** Relatório de reconciliação manual de estoque Redis ↔ PostgreSQL. */
export interface StockReconciliationReport {
  checkedAt: string;
  lotsChecked: number;
  correctedCount: number;
  lots: Array<{
    ticketLotId: string;
    pgAvailable: number;
    pendingInQueues: number;
    expectedRedis: number;
    previousRedis: number | null;
    corrected: boolean;
  }>;
}
