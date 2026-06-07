import { PKPass } from "passkit-generator";
import { env } from "../../../../shared/infrastructure/config/env";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import {
  ensurePassImages,
  formatEventDate,
  loadAppleCertificates,
  loadTicketContext,
} from "../helpers/walletHelpers";

const CONTEXT = "WalletService";
const logger = Logger.getInstance();

export async function generateApplePass(
  ticketId: string,
) {
  const { ticket, event, user } = await loadTicketContext(ticketId);

  try {
    const certificates = loadAppleCertificates();
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

    ensurePassImages(pass);

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

    logger.info(CONTEXT, "Apple Wallet pass generated", {
      ticketId: ticket.id,
      eventId: event.id,
    });

    return buffer;
  } catch (error) {
    logger.error(CONTEXT, "Failed to generate Apple Wallet pass", {
      ticketId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
