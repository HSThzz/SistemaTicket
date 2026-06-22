/**
 * @file Erros de emissão manual de ingressos pelo super admin.
 * @module modules/ticketing/domain/errors/ManualTicketError
 */

export class ManualTicketError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "ManualTicketError";
  }
}

export class ManualTicketForbiddenError extends ManualTicketError {
  constructor() {
    super("Apenas super administradores podem emitir ingressos manualmente.", "MANUAL_TICKET_FORBIDDEN");
  }
}

export class ManualTicketUserNotFoundError extends ManualTicketError {
  constructor(userId: string) {
    super("Usuário não encontrado.", "MANUAL_TICKET_USER_NOT_FOUND");
    this.userId = userId;
  }

  readonly userId: string;
}

export class ManualTicketLotNotFoundError extends ManualTicketError {
  constructor(ticketLotId: string) {
    super("Lote de ingressos não encontrado.", "MANUAL_TICKET_LOT_NOT_FOUND");
    this.ticketLotId = ticketLotId;
  }

  readonly ticketLotId: string;
}

export class ManualTicketInsufficientStockError extends ManualTicketError {
  constructor(available: number) {
    super(
      available > 0
        ? `Estoque insuficiente. Restam ${available} ingresso(s) neste lote.`
        : "Este lote está esgotado.",
      "MANUAL_TICKET_INSUFFICIENT_STOCK",
    );
    this.available = available;
  }

  readonly available: number;
}
