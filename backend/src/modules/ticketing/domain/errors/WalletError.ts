/**
 * @file Erros de domínio na geração de passes Apple/Google Wallet.
 * @module ticketing/domain/errors/WalletError
 */

/**
 * Erro base para operações de carteira digital.
 */
export class WalletError extends Error {
  /**
   * @param message - Mensagem legível.
   * @param code - Código estável para API.
   */
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "WalletError";
  }
}

/**
 * Ingresso não encontrado ou sem relações necessárias (pedido, evento).
 */
export class TicketNotFoundError extends WalletError {
  /**
   * @param ticketId - Identificador do ingresso.
   */
  constructor(ticketId: string) {
    super(`Ticket ${ticketId} not found`, "TICKET_NOT_FOUND");
    this.name = "TicketNotFoundError";
  }
}

/**
 * Certificados ou variáveis de ambiente da carteira não configurados.
 */
export class WalletConfigError extends WalletError {
  /**
   * @param message - Detalhe da configuração ausente ou inválida.
   */
  constructor(message: string) {
    super(message, "WALLET_CONFIG_ERROR");
    this.name = "WalletConfigError";
  }
}
