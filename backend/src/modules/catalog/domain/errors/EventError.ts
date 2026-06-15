/**
 * @file Erros de domínio do módulo de catálogo de eventos.
 * @module modules/catalog/domain/errors/EventError
 */

/** Erro base de operações sobre eventos. */
export class EventError extends Error {
  /**
   * @param message - Mensagem descritiva.
   * @param code - Código de erro exposto à API.
   */
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "EventError";
  }
}

/** Evento não encontrado pelo identificador. */
export class EventNotFoundError extends EventError {
  /**
   * @param eventId - ID do evento ausente.
   */
  constructor(eventId: string) {
    super(`Event ${eventId} not found`, "EVENT_NOT_FOUND");
    this.name = "EventNotFoundError";
  }
}

/** Produtor tenta gerenciar evento de outro usuário sem ser admin. */
export class EventAccessDeniedError extends EventError {
  constructor() {
    super("You do not have permission to manage this event", "EVENT_ACCESS_DENIED");
    this.name = "EventAccessDeniedError";
  }
}

/** Transição de status do evento não permitida (ex.: cancelado não pode voltar a publicado). */
export class EventInvalidStatusTransitionError extends EventError {
  constructor(from: string, to: string) {
    super(
      `Cannot change event status from ${from} to ${to}`,
      "EVENT_INVALID_STATUS_TRANSITION",
    );
    this.name = "EventInvalidStatusTransitionError";
  }
}
