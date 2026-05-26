import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Logger } from "../config/logger";
import { TicketNotFoundError, WalletError } from "../errors/WalletError";
import { WalletService } from "../services/WalletService";

const CONTEXT = "WalletController";
const logger = Logger.getInstance();
const walletService = new WalletService(AppDataSource);

export class WalletController {
  async downloadApplePass(req: Request, res: Response): Promise<void> {
    const ticketId = req.params.ticketId;

    if (typeof ticketId !== "string" || ticketId.length === 0) {
      res.status(400).json({ error: "ticketId is required" });
      return;
    }

    try {
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

  async redirectGoogleWallet(req: Request, res: Response): Promise<void> {
    const ticketId = req.params.ticketId;

    if (typeof ticketId !== "string" || ticketId.length === 0) {
      res.status(400).json({ error: "ticketId is required" });
      return;
    }

    try {
      const url = await walletService.generateGoogleWalletLink(ticketId);
      res.redirect(302, url);
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

export const walletController = new WalletController();
