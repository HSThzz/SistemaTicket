/**
 * @file Controlador HTTP de eventos e lotes de ingressos.
 * @module modules/catalog/interfaces/http/EventController
 */

import type { Request, Response } from "express";
import { TICKET_LOT_STOCK_KEY_PREFIX } from "../../../../shared/infrastructure/config/constants";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { getRedis } from "../../../../shared/infrastructure/config/redis";
import { EventStatus, EventType, UserRole } from "../../../../shared/kernel/enums";
import { STAFF_ROLES } from "../../../../shared/kernel/staffRoles";
import { ValidationError } from "../../../../shared/kernel/validateSchema";
import {
  EventAccessDeniedError,
  EventError,
  EventNotFoundError,
  EventTypeChangeNotAllowedError,
  TicketLotNotFoundError,
  CheckInStaffUserNotFoundError,
  CheckInStaffNotFoundError,
} from "../../domain/errors/EventError";
import { authMiddleware } from "../../../../shared/interfaces/http/middlewares/authMiddleware";
import { roleMiddleware } from "../../../../shared/interfaces/http/middlewares/roleMiddleware";
import { createEvent } from "../../application/services/createEvent";
import { createTicketLot } from "../../application/services/createTicketLot";
import { deleteTicketLot } from "../../application/services/deleteTicketLot";
import { updateTicketLot } from "../../application/services/updateTicketLot";
import { addCheckInStaff } from "../../application/services/addCheckInStaff";
import { listCheckInStaff } from "../../application/services/listCheckInStaff";
import { removeCheckInStaff } from "../../application/services/removeCheckInStaff";
import { getProducerDashboard } from "../../application/services/getProducerDashboard";
import { getPublishedEventById } from "../../application/services/getPublishedEventById";
import { listManagedEvents } from "../../application/services/listManagedEvents";
import { listPublishedEvents } from "../../application/services/listPublishedEvents";
import { updateEvent } from "../../application/services/updateEvent";
import { deleteEvent } from "../../application/services/deleteEvent";
import type { EventActor } from "../../application/types";
import { serializeEvent } from "../../application/helpers/serializeEvent";
import { serializeManagedEvent, serializeManagedEvents } from "../../application/helpers/serializeManagedEvents";

const CONTEXT = "EventController";
const logger = Logger.getInstance();

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
    const events = await listPublishedEvents();
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

    const events = await listManagedEvents(actor);
    res.status(200).json({
      events: await serializeManagedEvents(events),
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
      const stats = await getProducerDashboard(actor);
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
    const { eventId } = req.params as { eventId: string };

    const event = await getPublishedEventById(eventId);
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
      const { title, description, date, location, imageUrl, type } = req.body as {
        title: string;
        description: string;
        date: string;
        location: string;
        imageUrl?: string | null;
        type?: EventType;
      };

      const created = await createEvent({
          title,
          description,
          date,
          location,
          imageUrl:
            imageUrl === undefined || imageUrl === null || imageUrl === ""
              ? undefined
              : imageUrl,
          type,
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

    const { eventId } = req.params as { eventId: string };

    try {
      const { title, description, date, location, imageUrl, status, type } = req.body as {
        title?: string;
        description?: string;
        date?: string;
        location?: string;
        imageUrl?: string | null;
        status?: EventStatus;
        type?: EventType;
      };

      const updated = await updateEvent(eventId,
        {
          title,
          description,
          date,
          location,
          imageUrl:
            imageUrl === undefined
              ? undefined
              : imageUrl === null || imageUrl === ""
                ? null
                : imageUrl,
          status,
          type,
        },
        actor,
      );

      res.status(200).json({ event: await serializeManagedEvent(updated) });
    } catch (error) {
      this.handleError(res, error, "update", { eventId });
    }
  }

  /**
   * DELETE /events/:eventId — remove evento cancelado/encerrado da lista do produtor.
   * @param req - Parâmetro eventId.
   * @param res - 204 ou erro de domínio.
   * @returns Promise resolvida após enviar a resposta.
   */
  async remove(req: Request, res: Response): Promise<void> {
    const actor = requireActor(req, res);
    if (!actor) return;

    const { eventId } = req.params as { eventId: string };

    try {
      await deleteEvent(eventId, actor);
      res.status(204).send();
    } catch (error) {
      this.handleError(res, error, "delete", { eventId });
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

    const { eventId } = req.params as { eventId: string };

    try {
      const { name, price, totalQuantity, availableQuantity } = req.body as {
        name: string;
        price: number;
        totalQuantity: number;
        availableQuantity?: number;
      };

      const lot = await createTicketLot(eventId,
        {
          name,
          price,
          totalQuantity,
          availableQuantity,
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

  /**
   * DELETE /events/:eventId/lots/:lotId — remove lote sem vendas/reservas pendentes.
   */
  async deleteLot(req: Request, res: Response): Promise<void> {
    const actor = requireActor(req, res);
    if (!actor) return;

    const { eventId, lotId } = req.params as { eventId: string; lotId: string };

    try {
      await deleteTicketLot(eventId, lotId, actor);
      await getRedis().del(`${TICKET_LOT_STOCK_KEY_PREFIX}${lotId}`);
      res.status(204).send();
    } catch (error) {
      this.handleError(res, error, "deleteLot", { eventId, lotId });
    }
  }

  /**
   * PATCH /events/:eventId/lots/:lotId — edição segura (nome / preço / aumento de estoque).
   */
  async updateLot(req: Request, res: Response): Promise<void> {
    const actor = requireActor(req, res);
    if (!actor) return;

    const { eventId, lotId } = req.params as { eventId: string; lotId: string };

    try {
      const { lot, quantityDelta } = await updateTicketLot(
        eventId,
        lotId,
        req.body,
        actor,
      );

      if (quantityDelta > 0) {
        const redis = getRedis();
        const stockKey = `${TICKET_LOT_STOCK_KEY_PREFIX}${lot.id}`;
        const exists = await redis.exists(stockKey);

        if (exists) {
          await redis.incrby(stockKey, quantityDelta);
        } else {
          await redis.set(stockKey, String(lot.availableQuantity));
        }
      }

      res.status(200).json({
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
      this.handleError(res, error, "updateLot", { eventId, lotId });
    }
  }

  /**
   * GET /events/:eventId/check-in-staff — lista equipe de portaria.
   */
  async listCheckInStaff(req: Request, res: Response): Promise<void> {
    const actor = requireActor(req, res);
    if (!actor) return;

    const { eventId } = req.params as { eventId: string };

    try {
      const staff = await listCheckInStaff(eventId, actor);
      res.status(200).json({ staff });
    } catch (error) {
      this.handleError(res, error, "listCheckInStaff", { eventId });
    }
  }

  /**
   * POST /events/:eventId/check-in-staff — adiciona membro por e-mail.
   */
  async addCheckInStaff(req: Request, res: Response): Promise<void> {
    const actor = requireActor(req, res);
    if (!actor) return;

    const { eventId } = req.params as { eventId: string };

    try {
      const member = await addCheckInStaff(eventId, req.body, actor);
      res.status(201).json({ member });
    } catch (error) {
      this.handleError(res, error, "addCheckInStaff", { eventId });
    }
  }

  /**
   * DELETE /events/:eventId/check-in-staff/:userId — remove membro.
   */
  async removeCheckInStaff(req: Request, res: Response): Promise<void> {
    const actor = requireActor(req, res);
    if (!actor) return;

    const { eventId, userId } = req.params as { eventId: string; userId: string };

    try {
      await removeCheckInStaff(eventId, userId, actor);
      res.status(204).send();
    } catch (error) {
      this.handleError(res, error, "removeCheckInStaff", { eventId, userId });
    }
  }

  /** Mapeia erros de evento para status HTTP e log. */
  private handleError(
    res: Response,
    error: unknown,
    action: string,
    context: Record<string, unknown> = {},
  ): void {
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: error.message,
        code: error.code,
        field: error.issues[0]?.path || undefined,
      });
      return;
    }

    if (
      error instanceof EventNotFoundError ||
      error instanceof TicketLotNotFoundError ||
      error instanceof CheckInStaffUserNotFoundError ||
      error instanceof CheckInStaffNotFoundError
    ) {
      res.status(404).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof EventAccessDeniedError) {
      res.status(403).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof EventTypeChangeNotAllowedError) {
      res.status(400).json({ error: error.message, code: error.code });
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

/** Middlewares padrão para rotas de gestão (auth + PRODUCER ou equipe admin). */
export const eventManagementMiddlewares = [
  authMiddleware,
  roleMiddleware([...STAFF_ROLES, UserRole.PRODUCER]),
] as const;
