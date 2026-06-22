/**
 * @file Erros de domínio do módulo de solicitações de participação.
 * @module modules/participation/domain/errors/ParticipationError
 */

/** Erro base de operações sobre solicitações de participação. */
export class ParticipationError extends Error {
  /**
   * @param message - Mensagem descritiva.
   * @param code - Código de erro exposto à API.
   */
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "ParticipationError";
  }
}

/** Evento alvo da solicitação não encontrado. */
export class ParticipationEventNotFoundError extends ParticipationError {
  /**
   * @param eventId - ID do evento ausente.
   */
  constructor(eventId: string) {
    super(`Event ${eventId} not found`, "EVENT_NOT_FOUND");
    this.name = "ParticipationEventNotFoundError";
  }
}

/** Solicitação só faz sentido para eventos privados. */
export class ParticipationNotPrivateEventError extends ParticipationError {
  constructor() {
    super(
      "Participation requests are only available for private events",
      "EVENT_NOT_PRIVATE",
    );
    this.name = "ParticipationNotPrivateEventError";
  }
}

/** Já existe uma solicitação do mesmo usuário para o evento. */
export class ParticipationAlreadyRequestedError extends ParticipationError {
  constructor() {
    super(
      "You already have a participation request for this event",
      "PARTICIPATION_ALREADY_REQUESTED",
    );
    this.name = "ParticipationAlreadyRequestedError";
  }
}

/** Solicitação de participação não encontrada. */
export class ParticipationRequestNotFoundError extends ParticipationError {
  /**
   * @param requestId - ID da solicitação ausente.
   */
  constructor(requestId: string) {
    super(
      `Participation request ${requestId} not found`,
      "PARTICIPATION_REQUEST_NOT_FOUND",
    );
    this.name = "ParticipationRequestNotFoundError";
  }
}

/** Produtor tenta gerenciar solicitações de evento que não é dele. */
export class ParticipationAccessDeniedError extends ParticipationError {
  constructor() {
    super(
      "You do not have permission to manage participation requests for this event",
      "PARTICIPATION_ACCESS_DENIED",
    );
    this.name = "ParticipationAccessDeniedError";
  }
}

/** Solicitação já revisada não pode ser revisada novamente. */
export class ParticipationAlreadyReviewedError extends ParticipationError {
  /**
   * @param status - Status atual da solicitação.
   */
  constructor(status: string) {
    super(
      `Participation request was already reviewed (current: ${status})`,
      "PARTICIPATION_ALREADY_REVIEWED",
    );
    this.name = "ParticipationAlreadyReviewedError";
  }
}
