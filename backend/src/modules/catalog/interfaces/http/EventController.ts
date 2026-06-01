/**
 * @file Controlador HTTP de eventos e lotes de ingressos.
 * @module modules/catalog/interfaces/http/EventController
 */

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

/**
 * Converte valor de body em `EventStatus` quando válido.
 * @param value - Valor recebido do cliente.
 * @returns Status parseado ou `undefined` se omitido.
 * @throws {Error} Quando o valor não é string ou não é membro do enum.
 */
function parseEventStatus(value: unknown): EventStatus | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new Error("Invalid status");
  if (!(value in EventStatus)) throw new Error("Invalid status");
  return EventStatus[value as keyof typeof EventStatus];
}

/**
 * Extrai eventId de `req.params.eventId` (string ou array).
 * @param value - Parâmetro bruto do Express.
 * @returns ID normalizado ou string vazia.
 */
function parseEventId(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
}

/**
 * Obtém ator autenticado da requisição ou responde 401.
 * @param req - Requisição Express.
 * @param res - Resposta Express.
 * @returns Ator ou `null` se não autenticado.
 */
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

/**
 * Serializa entidade Event para JSON da API.
 * @param event - Evento com lotes opcionais.
 * @returns Objeto DTO para resposta HTTP.
 */
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

/**
 * Endpoints públicos e de gestão de eventos/lotes.
 */
export class EventController {
  /**
   * GET /events — lista eventos publicados.
   * @param _req - Requisição (não utilizada).
   * @param res - Lista serializada de eventos.
   * @returns Promise resolvida após enviar 200.
   */
  async listPublished(_req: Request, res: Response): Promise<void> {
    const events = await eventService.listPublished();
    res.status(200).json({
      events: events.map((event) => serializeEvent(event)),
    });
  }

  /**
   * GET /events/mine — lista eventos do produtor autenticado.
   * @param req - Requer usuário PRODUCER ou ADMIN.
   * @param res - Lista de eventos gerenciáveis.
   * @returns Promise resolvida após enviar 200 ou 401.
   */
  async listMine(req: Request, res: Response): Promise<void> {
    const actor = requireActor(req, res);
    if (!actor) return;

    const events = await eventService.listManaged(actor);
    res.status(200).json({
      events: events.map((event) => serializeEvent(event)),
    });
  }

  /**
   * GET /events/mine/stats — dashboard de métricas do produtor.
   * @param req - Requer usuário PRODUCER ou ADMIN.
   * @param res - Estatísticas agregadas ou 500 em falha.
   * @returns Promise resolvida após enviar a resposta.
   */
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

  /**
   * GET /events/:eventId — detalhe de evento publicado.
   * @param req - Parâmetro eventId.
   * @param res - Evento ou 404.
   * @returns Promise resolvida após enviar a resposta.
   */
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

  /**
   * POST /events — cria novo evento.
   * @param req - Corpo com campos obrigatórios e opcionais de status/imagem.
   * @param res - 201 com evento criado ou erro.
   * @returns Promise resolvida após enviar a resposta.
   */
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

  /**
   * PATCH /events/:eventId — atualiza evento existente.
   * @param req - Parâmetro eventId e corpo parcial.
   * @param res - 200 com evento ou erro de domínio.
   * @returns Promise resolvida após enviar a resposta.
   */
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

  /**
   * POST /events/:eventId/lots — cria lote e inicializa estoque no Redis.
   * @param req - Parâmetro eventId e dados do lote.
   * @param res - 201 com ticketLot ou erro.
   * @returns Promise resolvida após enviar a resposta.
   */
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

  /** Mapeia erros de evento para status HTTP e log. */
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

/** Instância singleton do controlador de eventos. */
export const eventController = new EventController();

/** Middlewares padrão para rotas de gestão (auth + PRODUCER ou ADMIN). */
export const eventManagementMiddlewares = [
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.PRODUCER]),
] as const;
