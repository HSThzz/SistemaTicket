import jwt from "jsonwebtoken";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import {
  buildGoogleWalletOrigins,
  ensureGoogleEventTicketClass,
} from "./ensureGoogleEventTicketClass";
import {
  loadGoogleCredentials,
  loadTicketContext,
  requireGoogleIssuerId,
  sanitizeWalletId,
} from "../helpers/walletHelpers";
import {
  formatTicketCheckInCode,
  getTicketQrPayload,
} from "../../../../shared/kernel/ticketCheckInCode";

const CONTEXT = "WalletService";
const GOOGLE_WALLET_SAVE_URL = "https://pay.google.com/gp/v/save";
const logger = Logger.getInstance();

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}…`;
}

export async function generateGoogleWalletLink(
  ticketId: string,
  requestOrigin?: string | null,
) {
  const { ticket, event } = await loadTicketContext(ticketId);

  try {
    const credentials = await loadGoogleCredentials();
    const issuerId = requireGoogleIssuerId();
    const classSuffix = `event_${sanitizeWalletId(event.id)}`;
    const objectSuffix = `ticket_${sanitizeWalletId(ticket.id)}`;
    const classId = `${issuerId}.${classSuffix}`;
    const objectId = `${issuerId}.${objectSuffix}`;
    const origins = buildGoogleWalletOrigins(requestOrigin);

    await ensureGoogleEventTicketClass(event, classId);

    const qrPayload = getTicketQrPayload(ticket);
    const displayCode = formatTicketCheckInCode(ticket.checkInCode);

    const claims = {
      iss: credentials.client_email,
      aud: "google",
      typ: "savetowallet",
      iat: Math.floor(Date.now() / 1000),
      origins,
      payload: {
        eventTicketObjects: [
          {
            id: objectId,
            classId,
            state: "ACTIVE",
            ticketHolderName: truncate(ticket.ownerName, 80),
            ticketNumber: displayCode,
            barcode: {
              type: "QR_CODE",
              value: qrPayload,
              alternateText: displayCode,
            },
            textModulesData: [
              {
                id: "owner_document",
                header: "DOCUMENTO",
                body: truncate(ticket.ownerDocument, 40),
              },
              {
                id: "event_description",
                header: "SOBRE O EVENTO",
                body: truncate(event.description, 500),
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
      origins,
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
