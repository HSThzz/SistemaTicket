import type { DataSource } from "typeorm";
import { Logger } from "../config/logger";
import { Event } from "../entities/Event";
import { TicketLot } from "../entities/TicketLot";
import { EventStatus, UserRole } from "../entities/enums";
import { EventAccessDeniedError, EventNotFoundError } from "../errors/EventError";

const CONTEXT = "EventService";

export interface EventActor {
  userId: string;
  role: UserRole;
}

export interface CreateEventInput {
  title: string;
  description: string;
  date: string;
  location: string;
  status?: EventStatus;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  status?: EventStatus;
}

export interface CreateTicketLotInput {
  name: string;
  price: number;
  totalQuantity: number;
  availableQuantity?: number;
}

export class EventService {
  private readonly logger = Logger.getInstance();

  constructor(private readonly dataSource: DataSource) {}

  async listPublished(): Promise<Event[]> {
    return this.dataSource.getRepository(Event).find({
      where: { status: EventStatus.PUBLISHED },
      order: { date: "ASC" },
      relations: { ticketLots: true },
    });
  }

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

  async getPublishedById(eventId: string): Promise<Event | null> {
    return this.dataSource.getRepository(Event).findOne({
      where: { id: eventId, status: EventStatus.PUBLISHED },
      relations: { ticketLots: true },
    });
  }

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
      status: input.status ?? EventStatus.DRAFT,
    });

    const saved = await this.dataSource.getRepository(Event).save(event);
    this.logger.info(CONTEXT, "Event created", {
      eventId: saved.id,
      producerId: saved.producerId,
      status: saved.status,
    });
    return saved;
  }

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
    return saved;
  }

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

  private assertCanManage(event: Event, actor: EventActor): void {
    if (actor.role === UserRole.ADMIN) {
      return;
    }

    if (event.producerId !== actor.userId) {
      throw new EventAccessDeniedError();
    }
  }
}
