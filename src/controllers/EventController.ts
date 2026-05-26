import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Logger } from "../config/logger";
import { EventStatus, UserRole } from "../entities/enums";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { EventService } from "../services/EventService";

const CONTEXT = "EventController";
const logger = Logger.getInstance();
const eventService = new EventService(AppDataSource);

function parseEventStatus(value: unknown): EventStatus | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new Error("Invalid status");
  if (!(value in EventStatus)) throw new Error("Invalid status");
  return EventStatus[value as keyof typeof EventStatus];
}

export class EventController {
  async listPublished(_req: Request, res: Response): Promise<void> {
    const events = await eventService.listPublished();
    res.status(200).json({
      events: events.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date.toISOString(),
        location: event.location,
        status: event.status,
        ticketLots: (event.ticketLots ?? []).map((lot) => ({
          id: lot.id,
          name: lot.name,
          price: lot.price,
          totalQuantity: lot.totalQuantity,
          availableQuantity: lot.availableQuantity,
        })),
      })),
    });
  }

  async getPublished(req: Request, res: Response): Promise<void> {
    const eventIdParam = req.params.eventId;
    const eventId =
      typeof eventIdParam === "string"
        ? eventIdParam
        : Array.isArray(eventIdParam)
          ? eventIdParam[0]
          : "";

    if (!eventId) {
      res.status(400).json({ error: "eventId is required", code: "VALIDATION_ERROR" });
      return;
    }

    const event = await eventService.getPublishedById(eventId);
    if (!event) {
      res.status(404).json({ error: "Event not found", code: "NOT_FOUND" });
      return;
    }

    res.status(200).json({
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date.toISOString(),
        location: event.location,
        status: event.status,
        ticketLots: (event.ticketLots ?? []).map((lot) => ({
          id: lot.id,
          name: lot.name,
          price: lot.price,
          totalQuantity: lot.totalQuantity,
          availableQuantity: lot.availableQuantity,
        })),
      },
    });
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, date, location, status } = req.body as Record<string, unknown>;
      if (!title || !description || !date || !location) {
        res.status(400).json({
          error: "title, description, date and location are required",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const created = await eventService.createEvent({
        title: String(title),
        description: String(description),
        date: String(date),
        location: String(location),
        status: parseEventStatus(status),
      });

      res.status(201).json({
        event: {
          id: created.id,
          title: created.title,
          description: created.description,
          date: created.date.toISOString(),
          location: created.location,
          status: created.status,
        },
      });
    } catch (error) {
      logger.error(CONTEXT, "Failed to create event", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(400).json({ error: "Invalid payload", code: "VALIDATION_ERROR" });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const eventIdParam = req.params.eventId;
    const eventId =
      typeof eventIdParam === "string"
        ? eventIdParam
        : Array.isArray(eventIdParam)
          ? eventIdParam[0]
          : "";

    if (!eventId) {
      res.status(400).json({ error: "eventId is required", code: "VALIDATION_ERROR" });
      return;
    }

    try {
      const { title, description, date, location, status } = req.body as Record<string, unknown>;
      const updated = await eventService.updateEvent(eventId, {
        title: title === undefined ? undefined : String(title),
        description: description === undefined ? undefined : String(description),
        date: date === undefined ? undefined : String(date),
        location: location === undefined ? undefined : String(location),
        status: parseEventStatus(status),
      });

      if (!updated) {
        res.status(404).json({ error: "Event not found", code: "NOT_FOUND" });
        return;
      }

      res.status(200).json({
        event: {
          id: updated.id,
          title: updated.title,
          description: updated.description,
          date: updated.date.toISOString(),
          location: updated.location,
          status: updated.status,
        },
      });
    } catch (error) {
      logger.error(CONTEXT, "Failed to update event", {
        eventId,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(400).json({ error: "Invalid payload", code: "VALIDATION_ERROR" });
    }
  }

  async createLot(req: Request, res: Response): Promise<void> {
    const eventIdParam = req.params.eventId;
    const eventId =
      typeof eventIdParam === "string"
        ? eventIdParam
        : Array.isArray(eventIdParam)
          ? eventIdParam[0]
          : "";

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

      const lot = await eventService.createTicketLot(eventId, {
        name: String(name),
        price: Number(price),
        totalQuantity: Number(totalQuantity),
        availableQuantity: availableQuantity === undefined ? undefined : Number(availableQuantity),
      });

      if (!lot) {
        res.status(404).json({ error: "Event not found", code: "NOT_FOUND" });
        return;
      }

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
      logger.error(CONTEXT, "Failed to create ticket lot", {
        eventId,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(400).json({ error: "Invalid payload", code: "VALIDATION_ERROR" });
    }
  }
}

export const eventController = new EventController();

export const eventManagementMiddlewares = [
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.PRODUCER]),
] as const;

