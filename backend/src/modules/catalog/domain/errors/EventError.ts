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

/** Evento não pode ser removido da lista (ex.: ainda publicado ou em rascunho). */
export class EventCannotDeleteError extends EventError {
  constructor(status: string) {
    super(
      `Only cancelled or finished events can be removed from the list (current: ${status})`,
      "EVENT_CANNOT_DELETE",
    );
    this.name = "EventCannotDeleteError";
  }
}

/** Alteração de tipo (PUBLIC/PRIVATE) não permitida no estado atual do evento. */
export class EventTypeChangeNotAllowedError extends EventError {
  constructor(message: string, code: string) {
    super(message, code);
    this.name = "EventTypeChangeNotAllowedError";
  }
}

/** Conteúdo do evento não pode ser editado no status atual. */
export class EventNotEditableError extends EventError {
  constructor(status: string) {
    super(
      `Event content cannot be edited while status is ${status}`,
      "EVENT_NOT_EDITABLE",
    );
    this.name = "EventNotEditableError";
  }
}

/** Novos lotes não são permitidos no status atual do evento. */
export class EventLotNotAllowedError extends EventError {
  constructor(status: string) {
    super(
      `Cannot create ticket lots while event status is ${status}`,
      "EVENT_LOT_NOT_ALLOWED",
    );
    this.name = "EventLotNotAllowedError";
  }
}

/** Publicação exige ao menos um lote de ingressos. */
export class EventPublishMissingLotsError extends EventError {
  constructor() {
    super(
      "Publish requires at least one ticket lot",
      "EVENT_PUBLISH_MISSING_LOTS",
    );
    this.name = "EventPublishMissingLotsError";
  }
}

/** Não é permitido publicar evento com data no passado. */
export class EventPublishPastDateError extends EventError {
  constructor(eventDay: string) {
    super(
      `Cannot publish an event with a past date (${eventDay})`,
      "EVENT_PUBLISH_PAST_DATE",
    );
    this.name = "EventPublishPastDateError";
  }
}

/** Lote de ingressos não encontrado no evento. */
export class TicketLotNotFoundError extends EventError {
  constructor(lotId: string) {
    super(`Ticket lot ${lotId} not found`, "TICKET_LOT_NOT_FOUND");
    this.name = "TicketLotNotFoundError";
  }
}

/** Lote não pode ser removido porque já teve vendas. */
export class TicketLotHasSalesError extends EventError {
  constructor() {
    super(
      "Cannot delete a ticket lot that already has issued tickets",
      "TICKET_LOT_HAS_SALES",
    );
    this.name = "TicketLotHasSalesError";
  }
}

/** Lote não pode ser removido com reservas pendentes. */
export class TicketLotHasPendingReservationsError extends EventError {
  constructor() {
    super(
      "Cannot delete a ticket lot with pending reservations",
      "TICKET_LOT_HAS_PENDING_RESERVATIONS",
    );
    this.name = "TicketLotHasPendingReservationsError";
  }
}

/** Preço só pode mudar sem reservas pendentes nem ingressos emitidos. */
export class TicketLotPriceLockedError extends EventError {
  constructor() {
    super(
      "Cannot change ticket lot price while it has pending reservations or issued tickets",
      "LOT_PRICE_LOCKED",
    );
    this.name = "TicketLotPriceLockedError";
  }
}

/** Quantidade total do lote só pode aumentar. */
export class TicketLotQuantityDecreaseForbiddenError extends EventError {
  constructor() {
    super(
      "Cannot decrease ticket lot total quantity",
      "LOT_QUANTITY_DECREASE_FORBIDDEN",
    );
    this.name = "TicketLotQuantityDecreaseForbiddenError";
  }
}

/** Evento publicado precisa manter ao menos um lote. */
export class TicketLotLastPublishedError extends EventError {
  constructor() {
    super(
      "Cannot delete the last ticket lot of a published event",
      "TICKET_LOT_LAST_OF_PUBLISHED_EVENT",
    );
    this.name = "TicketLotLastPublishedError";
  }
}

/** Usuário não encontrado ao adicionar equipe de portaria. */
export class CheckInStaffUserNotFoundError extends EventError {
  constructor() {
    super("User not found for the given email", "CHECK_IN_STAFF_USER_NOT_FOUND");
    this.name = "CheckInStaffUserNotFoundError";
  }
}

/** Usuário já está na equipe de portaria do evento. */
export class CheckInStaffAlreadyExistsError extends EventError {
  constructor() {
    super(
      "User is already on the check-in staff for this event",
      "CHECK_IN_STAFF_ALREADY_EXISTS",
    );
    this.name = "CheckInStaffAlreadyExistsError";
  }
}

/** Não faz sentido adicionar o dono do evento como equipe de portaria. */
export class CheckInStaffIsEventOwnerError extends EventError {
  constructor() {
    super(
      "Event owner already has check-in access",
      "CHECK_IN_STAFF_IS_EVENT_OWNER",
    );
    this.name = "CheckInStaffIsEventOwnerError";
  }
}

/** Membro da equipe de portaria não encontrado neste evento. */
export class CheckInStaffNotFoundError extends EventError {
  constructor() {
    super(
      "Check-in staff member not found for this event",
      "CHECK_IN_STAFF_NOT_FOUND",
    );
    this.name = "CheckInStaffNotFoundError";
  }
}
