/**
 * @file Serviço de aplicação de CRUD de eventos e lotes de ingressos.
 * @module modules/catalog/application/EventService
 */

import type { DataSource } from "typeorm";
import { Logger } from "../../../shared/infrastructure/config/logger";
import { Event } from "../../../shared/infrastructure/persistence/entities/Event";
import { TicketLot } from "../../../shared/infrastructure/persistence/entities/TicketLot";
import { EventStatus, UserRole } from "../../../shared/kernel/enums";
import { EventAccessDeniedError, EventNotFoundError } from "../domain/errors/EventError";

const CONTEXT = "EventService";

/** Ator autenticado que executa operações sobre eventos. */
export interface EventActor {
  userId: string;
  role: UserRole;
}

/** Dados para criação de um evento. */
export interface CreateEventInput {
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl?: string | null;
  status?: EventStatus;
}

/** Dados parciais para atualização de evento. */
export interface UpdateEventInput {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  imageUrl?: string | null;
  status?: EventStatus;
}

/** Dados para criação de lote de ingressos em um evento. */
export interface CreateTicketLotInput {
  name: string;
  price: number;
  totalQuantity: number;
  availableQuantity?: number;
}

/**
 * Regras de negócio de catálogo: listagem pública, gestão por produtor/admin e lotes.
 */
export class EventService {
  private readonly logger = Logger.getInstance();

  /**
   * @param dataSource - Fonte de dados TypeORM.
   */
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Lista eventos publicados para o catálogo público.
   * @returns Eventos com lotes, ordenados por data.
   */
  async listPublished(): Promise<Event[]> {
    return this.dataSource.getRepository(Event).find({
      where: { status: EventStatus.PUBLISHED },
      order: { date: "ASC" },
      relations: { ticketLots: true },
    });
  }

  /**
   * Lista eventos gerenciáveis pelo ator (todos para ADMIN, próprios para PRODUCER).
   * @param actor - Usuário autenticado e seu papel.
   * @returns Eventos com lotes.
   */
  async listManaged(actor: EventActor): Promise<Event[]> {
    const repository = this.dataSource.getRepository(Event);

    if (actor.role === UserRole.ADMIN) {
      return repository.find({
        order: { date: "ASC" },
        relations: { ticketLots: true },
      });
    }

    return repository.find({
      where: { producerId: actor.userId },
      order: { date: "ASC" },
      relations: { ticketLots: true },
    });
  }

  /**
   * Busca evento publicado por ID.
   * @param eventId - Identificador do evento.
   * @returns Evento com lotes ou `null` se não publicado ou inexistente.
   */
  async getPublishedById(eventId: string): Promise<Event | null> {
    return this.dataSource.getRepository(Event).findOne({
      where: { id: eventId, status: EventStatus.PUBLISHED },
      relations: { ticketLots: true },
    });
  }

  /**
   * Cria evento vinculado ao produtor do ator.
   * @param input - Dados do evento.
   * @param actor - Produtor ou admin que cria.
   * @returns Evento persistido com lotes.
   * @throws {Error} Quando a data é inválida.
   */
  async createEvent(input: CreateEventInput, actor: EventActor): Promise<Event> {
    const date = new Date(input.date);
    if (Number.isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }

    const event = this.dataSource.getRepository(Event).create({
      producerId: actor.userId,
      title: input.title.trim(),
      description: input.description.trim(),
      date,
      location: input.location.trim(),
      imageUrl: normalizeImageUrl(input.imageUrl),
      status: input.status ?? EventStatus.DRAFT,
    });

    const saved = await this.dataSource.getRepository(Event).save(event);
    this.logger.info(CONTEXT, "Event created", {
      eventId: saved.id,
      producerId: saved.producerId,
      status: saved.status,
    });
    return this.loadEventWithLots(saved.id);
  }

  /**
   * Atualiza campos de um evento existente.
   * @param eventId - ID do evento.
   * @param input - Campos a atualizar.
   * @param actor - Ator com permissão de gestão.
   * @returns Evento atualizado com lotes.
   * @throws {EventNotFoundError} Quando o evento não existe.
   * @throws {EventAccessDeniedError} Quando o produtor não é dono do evento.
   * @throws {Error} Quando a data informada é inválida.
   */
  async updateEvent(
    eventId: string,
    input: UpdateEventInput,
    actor: EventActor,
  ): Promise<Event> {
    const repository = this.dataSource.getRepository(Event);
    const event = await repository.findOne({ where: { id: eventId } });
    if (!event) {
      throw new EventNotFoundError(eventId);
    }

    this.assertCanManage(event, actor);

    if (input.title !== undefined) event.title = input.title.trim();
    if (input.description !== undefined) event.description = input.description.trim();
    if (input.location !== undefined) event.location = input.location.trim();
    if (input.imageUrl !== undefined) event.imageUrl = normalizeImageUrl(input.imageUrl);
    if (input.status !== undefined) event.status = input.status;
    if (input.date !== undefined) {
      const date = new Date(input.date);
      if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }
      event.date = date;
    }

    const saved = await repository.save(event);
    this.logger.info(CONTEXT, "Event updated", {
      eventId: saved.id,
      producerId: saved.producerId,
      status: saved.status,
      actorUserId: actor.userId,
    });
    return this.loadEventWithLots(saved.id);
  }

  /**
   * Cria lote de ingressos em um evento gerenciável pelo ator.
   * @param eventId - ID do evento.
   * @param input - Dados do lote.
   * @param actor - Ator com permissão de gestão.
   * @returns Lote persistido.
   * @throws {EventNotFoundError} Quando o evento não existe.
   * @throws {EventAccessDeniedError} Sem permissão de gestão.
   * @throws {Error} Quando preço ou quantidades são inválidos.
   */
  async createTicketLot(
    eventId: string,
    input: CreateTicketLotInput,
    actor: EventActor,
  ): Promise<TicketLot> {
    const event = await this.dataSource.getRepository(Event).findOne({
      where: { id: eventId },
    });
    if (!event) {
      throw new EventNotFoundError(eventId);
    }

    this.assertCanManage(event, actor);

    const availableQuantity = input.availableQuantity ?? input.totalQuantity;
    if (!Number.isInteger(input.price) || input.price < 0) {
      throw new Error("Invalid price");
    }
    if (!Number.isInteger(input.totalQuantity) || input.totalQuantity <= 0) {
      throw new Error("Invalid totalQuantity");
    }
    if (
      !Number.isInteger(availableQuantity) ||
      availableQuantity < 0 ||
      availableQuantity > input.totalQuantity
    ) {
      throw new Error("Invalid availableQuantity");
    }

    const lot = this.dataSource.getRepository(TicketLot).create({
      eventId: event.id,
      name: input.name.trim(),
      price: input.price,
      totalQuantity: input.totalQuantity,
      availableQuantity,
    });

    const saved = await this.dataSource.getRepository(TicketLot).save(lot);
    this.logger.info(CONTEXT, "Ticket lot created", {
      ticketLotId: saved.id,
      eventId: event.id,
      actorUserId: actor.userId,
    });
    return saved;
  }

  /** Carrega evento com relação `ticketLots`. */
  private async loadEventWithLots(eventId: string): Promise<Event> {
    const event = await this.dataSource.getRepository(Event).findOne({
      where: { id: eventId },
      relations: { ticketLots: true },
    });

    if (!event) {
      throw new EventNotFoundError(eventId);
    }

    return event;
  }

  /** Verifica se o ator pode alterar o evento (admin ou produtor dono). */
  private assertCanManage(event: Event, actor: EventActor): void {
    if (actor.role === UserRole.ADMIN) {
      return;
    }

    if (event.producerId !== actor.userId) {
      throw new EventAccessDeniedError();
    }
  }
}

/**
 * Normaliza URL de imagem: vazio ou só espaços vira `null`.
 * @param value - URL bruta ou ausente.
 * @returns URL trimada ou `null`.
 */
function normalizeImageUrl(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
