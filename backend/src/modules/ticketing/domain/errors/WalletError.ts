export class WalletError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "WalletError";
  }
}

export class TicketNotFoundError extends WalletError {
  constructor(ticketId: string) {
    super(`Ticket ${ticketId} not found`, "TICKET_NOT_FOUND");
    this.name = "TicketNotFoundError";
  }
}

export class WalletConfigError extends WalletError {
  constructor(message: string) {
    super(message, "WALLET_CONFIG_ERROR");
    this.name = "WalletConfigError";
  }
}
