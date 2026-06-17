/**
 * @file Controlador HTTP do formulário de contato de produtores.
 * @module modules/leads/interfaces/http/LeadController
 */

import type { Request, Response } from "express";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { ValidationError } from "../../../../shared/kernel/validateSchema";
import { createProducerLead } from "../../application/services/createProducerLead";
import type { ProducerLeadInputSchema } from "../../validators/schema/producerLeadSchema";

const CONTEXT = "LeadController";
const logger = Logger.getInstance();

/**
 * Adapta requisições HTTP para criação de leads e responde imediatamente após persistência.
 */
export class LeadController {
  /**
   * POST /leads/producer-contact — captura lead e enfileira notificações.
   */
  async submitProducerContact(req: Request, res: Response): Promise<void> {
    const body = req.body as ProducerLeadInputSchema;

    try {
      const result = await createProducerLead(body);

      res.status(201).json({
        id: result.id,
        message: "Mensagem recebida! Nossa equipe entrará em contato em breve.",
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private handleError(res: Response, error: unknown): void {
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: error.message,
        code: "VALIDATION_ERROR",
      });
      return;
    }

    logger.error(CONTEXT, "Unexpected error", {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
}

export const leadController = new LeadController();
