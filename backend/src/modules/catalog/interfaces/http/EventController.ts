import type { Request, Response } from "express";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { TICKET_LOT_STOCK_KEY_PREFIX } from "../../../../shared/infrastructure/config/constants";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { getRedis } from "../../../../shared/infrastructure/config/redis";
import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { EventStatus, UserRole } from "../../../../shared/kernel/enums";
import {
  EventAccessDeniedError,
  EventError,
  EventNotFoundError,
} from "../../domain/errors/EventError";
import { authMiddleware } from "../../../../shared/interfaces/http/middlewares/authMiddleware";
import { roleMiddleware } from "../../../../shared/interfaces/http/middlewares/roleMiddleware";
import { EventService, type EventActor } from "../../application/EventService";
import { EventDashboardService } from "../../application/EventDashboardService";

const CONTEXT = "EventController";
const logger = Logger.getInstance();
const eventService = new EventService(AppDataSource);
const eventDashboardService = new EventDashboardService(AppDataSource);

function parseEventStatus(value: unknown): EventStatus | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new Error("Invalid status");
  if (!(value in EventStatus)) throw new Error("Invalid status");
  return EventStatus[value as keyof typeof EventStatus];
}

function parseEventId(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
}

function requireActor(req: Request, res: Response): EventActor | null {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
    return null;
  }

  return {
    userId: req.user.id,
    role: req.user.role,
  };
}

function serializeEvent(event: Event) {
  return {
    id: event.id,
    producerId: event.producerId,
    title: event.title,
    description: event.description,
    date: event.date.toISOString(),
    location: event.location,
    imageUrl: event.imageUrl,
    status: event.status,
    ticketLots: (event.ticketLots ?? []).map((lot) => ({
      id: lot.id,
      name: lot.name,
      price: lot.price,
      totalQuantity: lot.totalQuantity,
      availableQuantity: lot.availableQuantity,
    })),
  };
}

export class EventController {
  async listPublished(_req: Request, res: Response): Promise<void> {
    const events = await eventService.listPublished();
    res.status(200).json({
      events: events.map((event) => serializeEvent(event)),
    });
  }

  async listMine(req: Request, res: Response): Promise<void> {
    const actor = requireActor(req, res);
    if (!actor) return;

    const events = await eventService.listManaged(actor);
    res.status(200).json({
      events: events.map((event) => serializeEvent(event)),
    });
  }

  async getMineStats(req: Request, res: Response): Promise<void> {
    const actor = requireActor(req, res);
    if (!actor) return;

    try {
      const stats = await eventDashboardService.getProducerDashboard(actor);
      res.status(200).json(stats);
    } catch (error) {
      logger.error(CONTEXT, "Failed to load producer dashboard stats", {
        userId: actor.userId,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        error: "Failed to load dashboard stats",
        code: "INTERNAL_ERROR",
      });
    }
  }

  async getPublished(req: Request, res: Response): Promise<void> {
    const eventId = parseEventId(req.params.eventId);
    if (!eventId) {
      res.status(400).json({ error: "eventId is required", code: "VALIDATION_ERROR" });
      return;
    }

    const event = await eventService.getPublishedById(eventId);
    if (!event) {
      res.status(404).json({ error: "Event not found", code: "NOT_FOUND" });
      return;
    }

    res.status(200).json({ event: serializeEvent(event) });
  }

  async create(req: Request, res: Response): Promise<void> {
    const actor = requireActor(req, res);
    if (!actor) return;

    try {
      const { title, description, date, location, imageUrl, status } = req.body as Record<string, unknown>;
      if (!title || !description || !date || !location) {
        res.status(400).json({
          error: "title, description, date and location are required",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const created = await eventService.createEvent(
        {
          title: String(title),
          description: String(description),
          date: String(date),
          location: String(location),
          imageUrl: imageUrl === undefined || imageUrl === null ? undefined : String(imageUrl),
          status: parseEventStatus(status),
        },
        actor,
      );

      res.status(201).json({ event: serializeEvent(created) });
    } catch (error) {
      this.handleError(res, error, "create");
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const actor = requireActor(req, res);
    if (!actor) return;

    const eventId = parseEventId(req.params.eventId);
    if (!eventId) {
      res.status(400).json({ error: "eventId is required", code: "VALIDATION_ERROR" });
      return;
    }

    try {
      const { title, description, date, location, imageUrl, status } = req.body as Record<string, unknown>;
      const updated = await eventService.updateEvent(
        eventId,
        {
          title: title === undefined ? undefined : String(title),
          description: description === undefined ? undefined : String(description),
          date: date === undefined ? undefined : String(date),
          location: location === undefined ? undefined : String(location),
          imageUrl:
            imageUrl === undefined
              ? undefined
              : imageUrl === null
                ? null
                : String(imageUrl),
          status: parseEventStatus(status),
        },
        actor,
      );

      res.status(200).json({ event: serializeEvent(updated) });
    } catch (error) {
      this.handleError(res, error, "update", { eventId });
    }
  }

  async createLot(req: Request, res: Response): Promise<void> {
    const actor = requireActor(req, res);
    if (!actor) return;

    const eventId = parseEventId(req.params.eventId);
    if (!eventId) {
      res.status(400).json({ error: "eventId is required", code: "VALIDATION_ERROR" });
      return;
    }

    try {
      const { name, price, totalQuantity, availableQuantity } = req.body as Record<string, unknown>;
      if (!name || price === undefined || totalQuantity === undefined) {
        res.status(400).json({
          error: "name, price and totalQuantity are required",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const lot = await eventService.createTicketLot(
        eventId,
        {
          name: String(name),
          price: Number(price),
          totalQuantity: Number(totalQuantity),
          availableQuantity:
            availableQuantity === undefined ? undefined : Number(availableQuantity),
        },
        actor,
      );

      await getRedis().set(
        `${TICKET_LOT_STOCK_KEY_PREFIX}${lot.id}`,
        String(lot.availableQuantity),
      );

      res.status(201).json({
        ticketLot: {
          id: lot.id,
          eventId: lot.eventId,
          name: lot.name,
          price: lot.price,
          totalQuantity: lot.totalQuantity,
          availableQuantity: lot.availableQuantity,
        },
      });
    } catch (error) {
      this.handleError(res, error, "createLot", { eventId });
    }
  }

  private handleError(
    res: Response,
    error: unknown,
    action: string,
    context: Record<string, unknown> = {},
  ): void {
    if (error instanceof EventNotFoundError) {
      res.status(404).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof EventAccessDeniedError) {
      res.status(403).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof EventError) {
      res.status(400).json({ error: error.message, code: error.code });
      return;
    }

    logger.error(CONTEXT, `Failed to ${action} event`, {
      ...context,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(400).json({ error: "Invalid payload", code: "VALIDATION_ERROR" });
  }
}

export const eventController = new EventController();

export const eventManagementMiddlewares = [
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.PRODUCER]),
] as const;
