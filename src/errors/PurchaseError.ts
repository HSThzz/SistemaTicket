export class PurchaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "PurchaseError";
  }
}

export class LockNotAcquiredError extends PurchaseError {
  constructor(ticketLotId: string) {
    super(
      `Could not acquire distributed lock for ticket lot ${ticketLotId}`,
      "LOCK_NOT_ACQUIRED",
    );
    this.name = "LockNotAcquiredError";
  }
}

export class TicketLotNotFoundError extends PurchaseError {
  constructor(ticketLotId: string) {
    super(`Ticket lot ${ticketLotId} not found`, "TICKET_LOT_NOT_FOUND");
    this.name = "TicketLotNotFoundError";
  }
}

export class InsufficientStockError extends PurchaseError {
  constructor(available: number, requested: number) {
    super(
      `Insufficient stock: available=${available}, requested=${requested}`,
      "INSUFFICIENT_STOCK",
    );
    this.name = "InsufficientStockError";
  }
}

export class InvalidQuantityError extends PurchaseError {
  constructor(quantity: number) {
    super(`Invalid quantity: ${quantity}`, "INVALID_QUANTITY");
    this.name = "InvalidQuantityError";
  }
}

export class ReservationNotFoundError extends PurchaseError {
  constructor(reservationId: string) {
    super(`Reservation ${reservationId} not found`, "RESERVATION_NOT_FOUND");
    this.name = "ReservationNotFoundError";
  }
}

export class ReservationAccessDeniedError extends PurchaseError {
  constructor() {
    super("You do not have access to this reservation", "RESERVATION_ACCESS_DENIED");
    this.name = "ReservationAccessDeniedError";
  }
}
