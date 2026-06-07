import jwt from "jsonwebtoken";
import { env } from "../../../../shared/infrastructure/config/env";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import {
  loadGoogleCredentials,
  loadTicketContext,
  requireGoogleIssuerId,
  sanitizeWalletId,
} from "../helpers/walletHelpers";

const CONTEXT = "WalletService";
const GOOGLE_WALLET_SAVE_URL = "https://pay.google.com/gp/v/save";
const logger = Logger.getInstance();

export async function generateGoogleWalletLink(
  ticketId: string,
) {
  const { ticket, event } = await loadTicketContext(ticketId);

  try {
    const credentials = await loadGoogleCredentials();
    const issuerId = requireGoogleIssuerId();
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

    logger.info(CONTEXT, "Google Wallet link generated", {
      ticketId: ticket.id,
      classId,
      objectId,
    });

    return url;
  } catch (error) {
    logger.error(CONTEXT, "Failed to generate Google Wallet link", {
      ticketId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
