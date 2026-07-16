/**
 * @file Garante que a EventTicketClass existe na API do Google Wallet.
 * @module ticketing/application/services/ensureGoogleEventTicketClass
 */

import { google } from "googleapis";
import { env } from "../../../../shared/infrastructure/config/env";
import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { WalletConfigError } from "../../domain/errors/WalletError";
import { loadGoogleCredentials } from "../helpers/walletHelpers";

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

/**
 * Banner da frente do card (API `heroImage`).
 * Exige URL HTTPS pública — o Google precisa baixar a imagem.
 */
function buildHeroImage(imageUrl: string | null | undefined) {
  const uri = imageUrl?.trim();
  if (!uri || !/^https:\/\//i.test(uri)) {
    return undefined;
  }

  return {
    sourceUri: { uri },
    contentDescription: localizedString("Capa do evento"),
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
  const heroImage = buildHeroImage(event.imageUrl);

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
    // Fallback quando não há capa; com heroImage o Google também deriva tons da imagem.
    hexBackgroundColor: "#000000",
    ...(heroImage ? { heroImage } : {}),
  };

  try {
    await wallet.eventticketclass.get({ resourceId: classId });
    await wallet.eventticketclass.patch({
      resourceId: classId,
      requestBody: classBody,
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
