/**
 * @file Garante que a EventTicketClass existe na API do Google Wallet.
 * @module ticketing/application/services/ensureGoogleEventTicketClass
 */

import { google } from "googleapis";
import { env } from "../../../../shared/infrastructure/config/env";
import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { WalletConfigError } from "../../domain/errors/WalletError";
import { loadGoogleCredentials } from "../helpers/walletHelpers";

/** Cor de fundo do card (API só aceita cor sólida — não há imagem de capa full-bleed). */
const GOOGLE_WALLET_BACKGROUND_COLOR = "#000000";

function getIssuerDisplayName(): string {
  return env.wallet.google.issuerName.trim() || "VIBRA";
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}…`;
}

function localizedString(value: string) {
  return {
    defaultValue: {
      language: "pt-BR",
      value,
    },
  };
}

/** Separa nome e endereço a partir do campo único `location` do evento. */
function buildGoogleWalletVenue(location: string): {
  name: string;
  address: string;
} {
  const trimmed = location.trim() || "Local a confirmar";
  const parts = trimmed
    .split(/\s*[—–-]\s*|\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    const venueName = parts[0] ?? trimmed;
    return {
      name: truncate(venueName, 120),
      address: truncate(parts.slice(1).join("\n"), 200),
    };
  }

  return {
    name: truncate(trimmed, 120),
    address: truncate(trimmed, 200),
  };
}

export async function ensureGoogleEventTicketClass(
  event: Event,
  classId: string,
): Promise<void> {
  const credentials = await loadGoogleCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
  });

  const wallet = google.walletobjects({ version: "v1", auth });
  const venue = buildGoogleWalletVenue(event.location);

  // Observação: a API do Google Wallet NÃO permite imagem como fundo do card.
  // `heroImage` vira uma faixa abaixo dos dados e alonga o ingresso — não usamos.
  const classBody = {
    id: classId,
    issuerName: getIssuerDisplayName(),
    reviewStatus: "underReview" as const,
    eventName: localizedString(truncate(event.title, 120)),
    venue: {
      name: localizedString(venue.name),
      address: localizedString(venue.address),
    },
    dateTime: {
      start: event.date.toISOString(),
    },
    hexBackgroundColor: GOOGLE_WALLET_BACKGROUND_COLOR,
  };

  try {
    const existing = await wallet.eventticketclass.get({ resourceId: classId });

    // Patch não remove `heroImage` se já existir; `update` com o campo omitido sim.
    const nextBody = { ...existing.data, ...classBody };
    delete (nextBody as { heroImage?: unknown }).heroImage;

    await wallet.eventticketclass.update({
      resourceId: classId,
      requestBody: nextBody,
    });
  } catch (error) {
    const status = (error as { code?: number }).code;
    if (status === 404) {
      await wallet.eventticketclass.insert({ requestBody: classBody });
      return;
    }
    throw error;
  }
}

export function buildGoogleWalletOrigins(
  requestOrigin?: string | null,
): string[] {
  const origins = new Set(
    env.wallet.google.origins
      .map((origin) => origin.trim().replace(/\/+$/, ""))
      .filter(Boolean),
  );

  if (requestOrigin?.trim()) {
    try {
      const url = new URL(requestOrigin);
      origins.add(`${url.protocol}//${url.host}`);
    } catch {
      // ignore malformed origin header
    }
  }

  const result = Array.from(origins);

  if (result.length === 0) {
    throw new WalletConfigError("GOOGLE_WALLET_ORIGINS is not configured");
  }

  return result;
}
