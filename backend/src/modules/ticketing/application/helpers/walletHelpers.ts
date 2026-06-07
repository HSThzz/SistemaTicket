import { readFileSync } from "node:fs";
import path from "node:path";
import { google } from "googleapis";
import { PKPass } from "passkit-generator";
import { env } from "../../../../shared/infrastructure/config/env";
import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import type { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import type { User } from "../../../../shared/infrastructure/persistence/entities/User";
import { TicketNotFoundError, WalletConfigError } from "../../domain/errors/WalletError";
import { findOneTicketById } from "../queries/findOneTicketById";

const GOOGLE_WALLET_SCOPE = "https://www.googleapis.com/auth/wallet_object.issuer";

/** PNG 1x1 mínimo válido para ícone do pass quando o modelo não incluir imagens. */
const FALLBACK_ICON_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

export interface GoogleServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

export interface TicketWalletContext {
  ticket: Ticket;
  event: Event;
  user: User;
}

export async function loadTicketContext(
  ticketId: string,
): Promise<TicketWalletContext> {
  const ticket = await findOneTicketById(ticketId);

  if (!ticket?.ticketLot?.event || !ticket.order?.user) {
    throw new TicketNotFoundError(ticketId);
  }

  return {
    ticket,
    event: ticket.ticketLot.event,
    user: ticket.order.user,
  };
}

export function loadAppleCertificates() {
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

export function ensurePassImages(pass: PKPass): void {
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

export async function loadGoogleCredentials(): Promise<GoogleServiceAccountCredentials> {
  const credentialsPath = env.wallet.google.credentialsPath;

  if (!credentialsPath) {
    throw new WalletConfigError("GOOGLE_WALLET_CREDENTIALS_PATH is not configured");
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: [GOOGLE_WALLET_SCOPE],
  });

  await auth.getClient();

  const raw = readFileSync(credentialsPath, "utf8");
  const parsed = JSON.parse(raw) as GoogleServiceAccountCredentials;

  if (!parsed.client_email || !parsed.private_key) {
    throw new WalletConfigError("Invalid Google service account credentials file");
  }

  return parsed;
}

export function requireGoogleIssuerId(): string {
  if (!env.wallet.google.issuerId) {
    throw new WalletConfigError("GOOGLE_WALLET_ISSUER_ID is not configured");
  }

  return env.wallet.google.issuerId;
}

export function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function sanitizeWalletId(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}
