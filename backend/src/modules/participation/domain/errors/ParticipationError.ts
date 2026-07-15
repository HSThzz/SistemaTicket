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

/** Evento não está publicado / aberto para novas solicitações. */
export class ParticipationEventNotAcceptingError extends ParticipationError {
  constructor() {
    super(
      "This event is not accepting participation requests",
      "EVENT_NOT_ACCEPTING_PARTICIPATION",
    );
    this.name = "ParticipationEventNotAcceptingError";
  }
}

/** Evento em status terminal não permite revisar solicitações. */
export class ParticipationEventNotReviewableError extends ParticipationError {
  constructor(status: string) {
    super(
      `Cannot review participation requests while event status is ${status}`,
      "EVENT_NOT_REVIEWABLE",
    );
    this.name = "ParticipationEventNotReviewableError";
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

/** Solicitação anterior foi recusada; reenvio não é permitido. */
export class ParticipationPreviouslyRejectedError extends ParticipationError {
  constructor() {
    super(
      "Your participation request for this event was previously rejected",
      "PARTICIPATION_REJECTED",
    );
    this.name = "ParticipationPreviouslyRejectedError";
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

/** Um ou mais lotes informados na aprovação não pertencem ao evento. */
export class ParticipationInvalidTicketLotsError extends ParticipationError {
  constructor() {
    super(
      "One or more ticket lots are invalid for this event",
      "PARTICIPATION_INVALID_TICKET_LOTS",
    );
    this.name = "ParticipationInvalidTicketLotsError";
  }
}

/** Evento sem lotes — não é possível aprovar participações ainda. */
export class ParticipationNoTicketLotsError extends ParticipationError {
  constructor() {
    super(
      "This event has no ticket lots to unlock on approval",
      "PARTICIPATION_NO_TICKET_LOTS",
    );
    this.name = "ParticipationNoTicketLotsError";
  }
}

/** Só solicitações APPROVED podem ter a lista de lotes editada. */
export class ParticipationLotsUpdateNotAllowedError extends ParticipationError {
  constructor(status: string) {
    super(
      `Cannot update allowed ticket lots while status is ${status}`,
      "PARTICIPATION_LOTS_UPDATE_NOT_ALLOWED",
    );
    this.name = "ParticipationLotsUpdateNotAllowedError";
  }
}
