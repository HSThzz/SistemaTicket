/**
 * @file Erros de domínio do fluxo de compra e reserva de ingressos.
 * @module sales/domain/errors/PurchaseError
 */

/**
 * Erro base para operações de compra/reserva.
 */
export class PurchaseError extends Error {
  /**
   * @param message - Mensagem legível do erro.
   * @param code - Código estável para API e logs.
   */
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "PurchaseError";
  }
}

/**
 * Falha ao obter lock distribuído no lote de ingressos.
 */
export class LockNotAcquiredError extends PurchaseError {
  /**
   * @param ticketLotId - Identificador do lote.
   */
  constructor(ticketLotId: string) {
    super(
      `Could not acquire distributed lock for ticket lot ${ticketLotId}`,
      "LOCK_NOT_ACQUIRED",
    );
    this.name = "LockNotAcquiredError";
  }
}

/**
 * Lote de ingressos não encontrado no banco.
 */
export class TicketLotNotFoundError extends PurchaseError {
  /**
   * @param ticketLotId - Identificador do lote inexistente.
   */
  constructor(ticketLotId: string) {
    super(`Ticket lot ${ticketLotId} not found`, "TICKET_LOT_NOT_FOUND");
    this.name = "TicketLotNotFoundError";
  }
}

/**
 * Estoque insuficiente para a quantidade solicitada.
 */
export class InsufficientStockError extends PurchaseError {
  /**
   * @param available - Quantidade disponível no momento da reserva.
   * @param requested - Quantidade solicitada pelo cliente.
   */
  constructor(available: number, requested: number) {
    super(
      `Insufficient stock: available=${available}, requested=${requested}`,
      "INSUFFICIENT_STOCK",
    );
    this.name = "InsufficientStockError";
  }
}

/**
 * Quantidade de ingressos inválida (não inteira ou não positiva).
 */
export class InvalidQuantityError extends PurchaseError {
  /**
   * @param quantity - Valor recebido na requisição.
   */
  constructor(quantity: number) {
    super(`Invalid quantity: ${quantity}`, "INVALID_QUANTITY");
    this.name = "InvalidQuantityError";
  }
}

/**
 * Reserva não encontrada no Redis nem no PostgreSQL.
 */
export class ReservationNotFoundError extends PurchaseError {
  /**
   * @param reservationId - Identificador da reserva.
   */
  constructor(reservationId: string) {
    super(`Reservation ${reservationId} not found`, "RESERVATION_NOT_FOUND");
    this.name = "ReservationNotFoundError";
  }
}

/**
 * Usuário autenticado não é dono da reserva consultada.
 */
export class ReservationAccessDeniedError extends PurchaseError {
  constructor() {
    super("You do not have access to this reservation", "RESERVATION_ACCESS_DENIED");
    this.name = "ReservationAccessDeniedError";
  }
}

/**
 * Usuário da reserva não existe mais no banco (ex.: token após reset do DB).
 */
export class ReserveUserNotFoundError extends PurchaseError {
  constructor(userId: string) {
    super(`User ${userId} not found`, "USER_NOT_FOUND");
    this.name = "ReserveUserNotFoundError";
  }
}

/**
 * Evento privado exige solicitação de participação aprovada antes do checkout.
 */
export class ParticipationNotApprovedError extends PurchaseError {
  constructor() {
    super(
      "This is a private event. Your participation request must be approved before checkout.",
      "PARTICIPATION_NOT_APPROVED",
    );
    this.name = "ParticipationNotApprovedError";
  }
}

/**
 * Evento não está publicado (ou foi cancelado/finalizado) — compra bloqueada.
 */
export class EventNotOnSaleError extends PurchaseError {
  constructor() {
    super(
      "This event is not available for purchase",
      "EVENT_NOT_ON_SALE",
    );
    this.name = "EventNotOnSaleError";
  }
}

/**
 * Usuário já possui pedido PENDING — nova reserva bloqueada até pagar ou expirar.
 */
export class PendingOrderExistsError extends PurchaseError {
  constructor() {
    super(
      "You already have a pending order. Pay or wait for it to expire before reserving again.",
      "PENDING_ORDER_EXISTS",
    );
    this.name = "PendingOrderExistsError";
  }
}
