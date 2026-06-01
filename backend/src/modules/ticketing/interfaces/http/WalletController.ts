/**
 * @file Controlador HTTP de passes Apple Wallet e Google Wallet.
 * @module ticketing/interfaces/http/WalletController
 */

import type { Request, Response } from "express";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { UserRole } from "../../../../shared/kernel/enums";
import { TicketNotFoundError, WalletError } from "../../domain/errors/WalletError";
import { WalletAccessService } from "../../application/WalletAccessService";
import { WalletService } from "../../application/WalletService";

const CONTEXT = "WalletController";
const logger = Logger.getInstance();
const walletService = new WalletService(AppDataSource);
const walletAccessService = new WalletAccessService(AppDataSource);

/**
 * Download e redirecionamento de passes digitais por ingresso.
 */
export class WalletController {
  /**
   * @param req - Parâmetro `ticketId` na URL.
   * @param res - Arquivo `.pkpass` ou erro 403/404/503.
   */
  async downloadApplePass(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const ticketId = req.params.ticketId;

    if (typeof ticketId !== "string" || ticketId.length === 0) {
      res.status(400).json({ error: "ticketId is required" });
      return;
    }

    try {
      const allowed = await walletAccessService.canAccessTicket(ticketId, {
        userId: req.user.id,
        role: req.user.role as UserRole,
      });

      if (!allowed) {
        res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
        return;
      }

      const buffer = await walletService.generateApplePass(ticketId);

      res.setHeader("Content-Type", "application/vnd.apple.pkpass");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="ticket-${ticketId}.pkpass"`,
      );
      res.send(buffer);
    } catch (error) {
      this.handleError(res, "Apple Wallet pass generation failed", ticketId, error);
    }
  }

  /**
   * @param req - Parâmetro `ticketId`.
   * @param res - Redirect 302 para URL do Google Wallet.
   */
  async redirectGoogleWallet(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const ticketId = req.params.ticketId;

    if (typeof ticketId !== "string" || ticketId.length === 0) {
      res.status(400).json({ error: "ticketId is required" });
      return;
    }

    try {
      const allowed = await walletAccessService.canAccessTicket(ticketId, {
        userId: req.user.id,
        role: req.user.role as UserRole,
      });

      if (!allowed) {
        res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
        return;
      }

      const url = await walletService.generateGoogleWalletLink(ticketId);
      res.redirect(302, url);
    } catch (error) {
      this.handleError(res, "Google Wallet link generation failed", ticketId, error);
    }
  }

  /**
   * @param req - Parâmetro `ticketId`.
   * @param res - JSON `{ url }` sem redirecionamento.
   */
  async getGoogleWalletLink(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const ticketId = req.params.ticketId;

    if (typeof ticketId !== "string" || ticketId.length === 0) {
      res.status(400).json({ error: "ticketId is required" });
      return;
    }

    try {
      const allowed = await walletAccessService.canAccessTicket(ticketId, {
        userId: req.user.id,
        role: req.user.role as UserRole,
      });

      if (!allowed) {
        res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
        return;
      }

      const url = await walletService.generateGoogleWalletLink(ticketId);
      res.json({ url });
    } catch (error) {
      this.handleError(res, "Google Wallet link generation failed", ticketId, error);
    }
  }

  private handleError(
    res: Response,
    message: string,
    ticketId: string,
    error: unknown,
  ): void {
    logger.error(CONTEXT, message, {
      ticketId,
      error: error instanceof Error ? error.message : String(error),
      code: error instanceof WalletError ? error.code : "INTERNAL_ERROR",
    });

    if (error instanceof TicketNotFoundError) {
      res.status(404).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof WalletError) {
      res.status(503).json({ error: error.message, code: error.code });
      return;
    }

    res.status(500).json({
      error: "Failed to generate wallet pass",
      code: "INTERNAL_ERROR",
    });
  }
}

/** Instância singleton do controlador de carteira digital. */
export const walletController = new WalletController();
