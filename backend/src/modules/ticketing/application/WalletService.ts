/**
 * @file Geração de passes Apple Wallet (.pkpass) e links Google Wallet.
 * @module ticketing/application/WalletService
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import type { DataSource } from "typeorm";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import { PKPass } from "passkit-generator";
import { env } from "../../../shared/infrastructure/config/env";
import { Logger } from "../../../shared/infrastructure/config/logger";
import { Ticket } from "../../../shared/infrastructure/persistence/entities/Ticket";
import type { Event } from "../../../shared/infrastructure/persistence/entities/Event";
import type { User } from "../../../shared/infrastructure/persistence/entities/User";
import {
  TicketNotFoundError,
  WalletConfigError,
} from "../domain/errors/WalletError";

const CONTEXT = "WalletService";
const GOOGLE_WALLET_SAVE_URL = "https://pay.google.com/gp/v/save";
const GOOGLE_WALLET_SCOPE =
  "https://www.googleapis.com/auth/wallet_object.issuer";

/** PNG 1x1 mínimo válido para ícone do pass quando o modelo não incluir imagens. */
const FALLBACK_ICON_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

interface GoogleServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

interface TicketWalletContext {
  ticket: Ticket;
  event: Event;
  user: User;
}

/**
 * Monta passes digitais a partir do ingresso, evento e titular.
 */
export class WalletService {
  private readonly logger = Logger.getInstance();

  /**
   * @param dataSource - Conexão TypeORM para carregar ingresso e relações.
   */
  constructor(private readonly dataSource: DataSource) {}

  /**
   * @param ticketId - Ingresso a exportar.
   * @returns Buffer do arquivo `.pkpass`.
   * @throws {TicketNotFoundError} Ingresso ou relações ausentes.
   * @throws {WalletConfigError} Certificados Apple não configurados.
   */
  async generateApplePass(ticketId: string): Promise<Buffer> {
    const { ticket, event, user } = await this.loadTicketContext(ticketId);

    try {
      const certificates = this.loadAppleCertificates();
      const pass = await PKPass.from(
        {
          model: env.wallet.apple.passModelPath,
          certificates,
        },
        {
          serialNumber: ticket.id,
          teamIdentifier: env.wallet.apple.teamId,
          passTypeIdentifier: env.wallet.apple.passTypeIdentifier,
          organizationName: env.wallet.apple.organizationName,
          description: event.title,
          logoText: event.title,
        },
      );

      this.ensurePassImages(pass);

      pass.type = "eventTicket";

      pass.headerFields.push({
        key: "date",
        label: "DATA",
        value: formatEventDate(event.date),
      });

      pass.primaryFields.push({
        key: "event",
        label: "EVENTO",
        value: event.title,
      });

      pass.secondaryFields.push(
        {
          key: "location",
          label: "LOCAL",
          value: event.location,
        },
        {
          key: "holder",
          label: "TITULAR",
          value: ticket.ownerName,
        },
      );

      pass.auxiliaryFields.push({
        key: "email",
        label: "E-MAIL",
        value: user.email,
      });

      pass.backFields.push(
        {
          key: "description",
          label: "DESCRIÇÃO",
          value: event.description,
        },
        {
          key: "document",
          label: "DOCUMENTO",
          value: ticket.ownerDocument,
        },
        {
          key: "code",
          label: "CÓDIGO",
          value: ticket.uniqueCode,
        },
      );

      pass.setBarcodes({
        message: ticket.uniqueCode,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
        altText: ticket.uniqueCode,
      });

      const buffer = pass.getAsBuffer();

      this.logger.info(CONTEXT, "Apple Wallet pass generated", {
        ticketId: ticket.id,
        eventId: event.id,
      });

      return buffer;
    } catch (error) {
      this.logger.error(CONTEXT, "Failed to generate Apple Wallet pass", {
        ticketId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * @param ticketId - Ingresso a exportar.
   * @returns URL `pay.google.com` com JWT assinado (Save to Wallet).
   * @throws {TicketNotFoundError} Ingresso inexistente.
   * @throws {WalletConfigError} Credenciais Google ausentes.
   */
  async generateGoogleWalletLink(ticketId: string): Promise<string> {
    const { ticket, event } = await this.loadTicketContext(ticketId);

    try {
      const credentials = await this.loadGoogleCredentials();
      const issuerId = this.requireGoogleIssuerId();
      const classSuffix = `event_${sanitizeWalletId(event.id)}`;
      const objectSuffix = `ticket_${sanitizeWalletId(ticket.id)}`;
      const classId = `${issuerId}.${classSuffix}`;
      const objectId = `${issuerId}.${objectSuffix}`;

      const claims = {
        iss: credentials.client_email,
        aud: "google",
        typ: "savetowallet",
        iat: Math.floor(Date.now() / 1000),
        origins: env.wallet.google.origins,
        payload: {
          eventTicketClasses: [
            {
              id: classId,
              issuerName: env.wallet.apple.organizationName,
              reviewStatus: "UNDER_REVIEW",
              eventName: {
                defaultValue: {
                  language: "pt-BR",
                  value: event.title,
                },
              },
              venue: {
                name: {
                  defaultValue: {
                    language: "pt-BR",
                    value: event.location,
                  },
                },
              },
              dateTime: {
                start: event.date.toISOString(),
              },
            },
          ],
          eventTicketObjects: [
            {
              id: objectId,
              classId,
              state: "ACTIVE",
              ticketHolderName: ticket.ownerName,
              ticketNumber: ticket.uniqueCode.slice(0, 20),
              barcode: {
                type: "QR_CODE",
                value: ticket.uniqueCode,
                alternateText: ticket.uniqueCode,
              },
              textModulesData: [
                {
                  id: "owner_document",
                  header: "DOCUMENTO",
                  body: ticket.ownerDocument,
                },
                {
                  id: "event_description",
                  header: "SOBRE O EVENTO",
                  body: event.description,
                },
              ],
            },
          ],
        },
      };

      const token = jwt.sign(claims, credentials.private_key, {
        algorithm: "RS256",
      });

      const url = `${GOOGLE_WALLET_SAVE_URL}/${token}`;

      this.logger.info(CONTEXT, "Google Wallet link generated", {
        ticketId: ticket.id,
        classId,
        objectId,
      });

      return url;
    } catch (error) {
      this.logger.error(CONTEXT, "Failed to generate Google Wallet link", {
        ticketId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async loadTicketContext(ticketId: string): Promise<TicketWalletContext> {
    const ticket = await this.dataSource.getRepository(Ticket).findOne({
      where: { id: ticketId },
      relations: {
        order: { user: true },
        ticketLot: { event: true },
      },
    });

    if (!ticket?.ticketLot?.event || !ticket.order?.user) {
      throw new TicketNotFoundError(ticketId);
    }

    return {
      ticket,
      event: ticket.ticketLot.event,
      user: ticket.order.user,
    };
  }

  private loadAppleCertificates() {
    const { wwdrCertPath, signerCertPath, signerKeyPath, signerKeyPassphrase } =
      env.wallet.apple;

    if (
      !wwdrCertPath ||
      !signerCertPath ||
      !signerKeyPath ||
      !signerKeyPassphrase ||
      !env.wallet.apple.teamId ||
      !env.wallet.apple.passTypeIdentifier
    ) {
      throw new WalletConfigError(
        "Apple Wallet certificates and identifiers are not configured",
      );
    }

    return {
      wwdr: readFileSync(wwdrCertPath),
      signerCert: readFileSync(signerCertPath),
      signerKey: readFileSync(signerKeyPath),
      signerKeyPassphrase,
    };
  }

  private ensurePassImages(pass: PKPass): void {
    const iconPath = path.join(env.wallet.apple.passModelPath, "icon.png");
    const logoPath = path.join(env.wallet.apple.passModelPath, "logo.png");

    try {
      pass.addBuffer("icon.png", readFileSync(iconPath));
    } catch {
      pass.addBuffer("icon.png", FALLBACK_ICON_PNG);
      pass.addBuffer("icon@2x.png", FALLBACK_ICON_PNG);
    }

    try {
      pass.addBuffer("logo.png", readFileSync(logoPath));
    } catch {
      pass.addBuffer("logo.png", FALLBACK_ICON_PNG);
    }
  }

  private async loadGoogleCredentials(): Promise<GoogleServiceAccountCredentials> {
    const credentialsPath = env.wallet.google.credentialsPath;

    if (!credentialsPath) {
      throw new WalletConfigError(
        "GOOGLE_WALLET_CREDENTIALS_PATH is not configured",
      );
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: [GOOGLE_WALLET_SCOPE],
    });

    await auth.getClient();

    const raw = readFileSync(credentialsPath, "utf8");
    const parsed = JSON.parse(raw) as GoogleServiceAccountCredentials;

    if (!parsed.client_email || !parsed.private_key) {
      throw new WalletConfigError(
        "Invalid Google service account credentials file",
      );
    }

    return parsed;
  }

  private requireGoogleIssuerId(): string {
    if (!env.wallet.google.issuerId) {
      throw new WalletConfigError("GOOGLE_WALLET_ISSUER_ID is not configured");
    }

    return env.wallet.google.issuerId;
  }
}

function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function sanitizeWalletId(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}
