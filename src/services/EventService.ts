import type { DataSource } from "typeorm";
import { Logger } from "../config/logger";
import { Event } from "../entities/Event";
import { TicketLot } from "../entities/TicketLot";
import { EventStatus } from "../entities/enums";

const CONTEXT = "EventService";

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

  async getPublishedById(eventId: string): Promise<Event | null> {
    return this.dataSource.getRepository(Event).findOne({
      where: { id: eventId, status: EventStatus.PUBLISHED },
      relations: { ticketLots: true },
    });
  }

  async createEvent(input: CreateEventInput): Promise<Event> {
    const date = new Date(input.date);
    if (Number.isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }

    const event = this.dataSource.getRepository(Event).create({
      title: input.title.trim(),
      description: input.description.trim(),
      date,
      location: input.location.trim(),
      status: input.status ?? EventStatus.DRAFT,
    });

    const saved = await this.dataSource.getRepository(Event).save(event);
    this.logger.info(CONTEXT, "Event created", { eventId: saved.id, status: saved.status });
    return saved;
  }

  async updateEvent(eventId: string, input: UpdateEventInput): Promise<Event | null> {
    const repository = this.dataSource.getRepository(Event);
    const event = await repository.findOne({ where: { id: eventId } });
    if (!event) {
      return null;
    }

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
    this.logger.info(CONTEXT, "Event updated", { eventId: saved.id, status: saved.status });
    return saved;
  }

  async createTicketLot(eventId: string, input: CreateTicketLotInput): Promise<TicketLot | null> {
    const event = await this.dataSource.getRepository(Event).findOne({ where: { id: eventId } });
    if (!event) {
      return null;
    }

    const availableQuantity = input.availableQuantity ?? input.totalQuantity;
    if (!Number.isInteger(input.price) || input.price < 0) {
      throw new Error("Invalid price");
    }
    if (!Number.isInteger(input.totalQuantity) || input.totalQuantity <= 0) {
      throw new Error("Invalid totalQuantity");
    }
    if (!Number.isInteger(availableQuantity) || availableQuantity < 0 || availableQuantity > input.totalQuantity) {
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
    this.logger.info(CONTEXT, "Ticket lot created", { ticketLotId: saved.id, eventId: event.id });
    return saved;
  }
}

