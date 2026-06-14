/**
 * @file Integração PIX com a API REST do Mercado Pago.
 * @module payment/infrastructure/gateways/MercadoPagoPixGateway
 */

import { randomUUID } from "node:crypto";
import { env } from "../../../../shared/infrastructure/config/env";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { resolveMercadoPagoPayerEmail } from "../../application/helpers/resolveMercadoPagoPayerEmail";
import {
  resolveMercadoPagoPayerIdentification,
} from "../../application/helpers/resolveMercadoPagoPayerDocument";
import { PaymentGatewayError } from "../../domain/errors/PaymentError";
import type {
  CardChargeResult,
  CreateCardChargeInput,
  CreatePixChargeInput,
  GatewayPaymentSnapshot,
  PaymentGateway,
  PaymentGatewayWithCard,
  PixChargeResult,
} from "./PaymentGateway";

const DEFAULT_EXPIRATION_MINUTES = 15;
const GATEWAY_LOG_CONTEXT = "MercadoPagoPixGateway";
const gatewayLogger = Logger.getInstance();

interface MercadoPagoPaymentResponse {
  id: number | string;
  status: string;
  external_reference?: string;
  date_of_expiration?: string;
  date_created?: string;
  status_detail?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
  cause?: Array<{ code?: string; description?: string }>;
  message?: string;
  error?: string;
}

/**
 * Gateway PIX e cartão de crédito real via Mercado Pago (`/v1/payments`).
 */
export class MercadoPagoPixGateway implements PaymentGateway, PaymentGatewayWithCard {
  readonly provider = "mercadopago" as const;

  /**
   * @param accessToken - Token de acesso da aplicação MP.
   * @param apiBaseUrl - URL base da API (sandbox ou produção).
   * @param notificationUrl - URL opcional de webhook registrada na cobrança.
   */
  constructor(
    private readonly accessToken: string,
    private readonly apiBaseUrl: string,
    private readonly notificationUrl?: string,
  ) {}

  /**
   * @inheritdoc
   * @throws {PaymentGatewayError} Se a API não retornar `qr_code` PIX.
   */
  async createPixCharge(input: CreatePixChargeInput): Promise<PixChargeResult> {
    const expiresAt = new Date(Date.now() + DEFAULT_EXPIRATION_MINUTES * 60 * 1000);
    const identification = input.payerDocument
      ? resolveMercadoPagoPayerIdentification(input.payerDocument)
      : undefined;

    const body: Record<string, unknown> = {
      transaction_amount: input.amountCents / 100,
      description: input.description,
      payment_method_id: "pix",
      external_reference: input.orderId,
      date_of_expiration: formatMercadoPagoExpiration(expiresAt),
      payer: {
        email: resolveMercadoPagoPayerEmail(input.payerEmail),
        ...(input.payerFirstName ? { first_name: input.payerFirstName } : {}),
        ...(identification ? { identification } : {}),
      },
    };

    if (this.notificationUrl) {
      body.notification_url = this.notificationUrl;
    }

    const response = await this.request<MercadoPagoPaymentResponse>("POST", "/v1/payments", {
      body,
      idempotencyKey: input.orderId,
    });

    const qrCode = response.point_of_interaction?.transaction_data?.qr_code;
    if (!qrCode) {
      throw new PaymentGatewayError(
        "Mercado Pago did not return PIX qr_code",
        "MERCADOPAGO_PIX_UNAVAILABLE",
      );
    }

    const expiration = response.date_of_expiration
      ? new Date(response.date_of_expiration)
      : expiresAt;

    return {
      transactionId: String(response.id),
      pixCopyPaste: qrCode,
      expiresAt: expiration,
    };
  }

  /**
   * Cria uma cobrança via cartão de crédito usando o token gerado no front-end.
   *
   * @inheritdoc
   * @throws {PaymentGatewayError} Em erro HTTP da API do Mercado Pago.
   */
  async createCardCharge(input: CreateCardChargeInput): Promise<CardChargeResult> {
    const identification = input.payerDocument
      ? resolveMercadoPagoPayerIdentification(input.payerDocument)
      : undefined;

    const body: Record<string, unknown> = {
      transaction_amount: input.amountCents / 100,
      description: input.description,
      token: input.token,
      payment_method_id: input.paymentMethodId,
      installments: input.installments,
      external_reference: input.orderId,
      payer: {
        email: resolveMercadoPagoPayerEmail(input.payerEmail),
        ...(identification ? { identification } : {}),
      },
    };

    if (this.notificationUrl) {
      body.notification_url = this.notificationUrl;
    }

    const response = await this.request<MercadoPagoPaymentResponse>("POST", "/v1/payments", {
      body,
      idempotencyKey: `card-${input.orderId}-${input.token}`,
    });

    return {
      transactionId: String(response.id),
      status: mapMercadoPagoStatus(response.status),
      statusDetail: response.status_detail,
    };
  }

  /**
   * @param transactionId - ID do pagamento no Mercado Pago.
   * @throws {PaymentGatewayError} Em erro HTTP da API de reembolso.
   */
  async refundPayment(transactionId: string): Promise<void> {
    await this.request("POST", `/v1/payments/${transactionId}/refunds`, {
      body: {},
      idempotencyKey: `refund-${transactionId}`,
    });
  }

  /**
   * @param transactionId - ID do pagamento no Mercado Pago.
   * @returns Snapshot com `external_reference` como `orderId`.
   * @throws {PaymentGatewayError} Se faltar `external_reference`.
   */
  async getPayment(transactionId: string): Promise<GatewayPaymentSnapshot> {
    const response = await this.fetchPaymentResponse(transactionId);

    if (!response.external_reference) {
      throw new PaymentGatewayError(
        "Mercado Pago payment missing external_reference",
        "MERCADOPAGO_INVALID_PAYMENT",
      );
    }

    return {
      transactionId: String(response.id),
      orderId: response.external_reference,
      status: mapMercadoPagoStatus(response.status),
      failureReason: response.status_detail,
    };
  }

  /**
   * Recupera copia-e-cola PIX de um pagamento já criado.
   * @param transactionId - ID do pagamento no Mercado Pago.
   * @returns QR/copia-e-cola e expiração, ou `null` se indisponível.
   */
  async getPixCopyPaste(transactionId: string): Promise<{
    pixCopyPaste: string;
    expiresAt: Date;
  } | null> {
    const response = await this.fetchPaymentResponse(transactionId);
    const qrCode = response.point_of_interaction?.transaction_data?.qr_code;

    if (!qrCode) {
      return null;
    }

    const expiresAt = response.date_of_expiration
      ? new Date(response.date_of_expiration)
      : new Date(Date.now() + DEFAULT_EXPIRATION_MINUTES * 60 * 1000);

    return { pixCopyPaste: qrCode, expiresAt };
  }

  private async fetchPaymentResponse(
    transactionId: string,
  ): Promise<MercadoPagoPaymentResponse> {
    return this.request<MercadoPagoPaymentResponse>(
      "GET",
      `/v1/payments/${transactionId}`,
    );
  }

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    options?: { body?: Record<string, unknown>; idempotencyKey?: string },
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    };

    if (options?.idempotencyKey) {
      headers["X-Idempotency-Key"] = options.idempotencyKey;
    } else if (method === "POST") {
      headers["X-Idempotency-Key"] = randomUUID();
    }

    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    const payload = (await response.json()) as MercadoPagoPaymentResponse & T;

    if (!response.ok) {
      const details = formatMercadoPagoApiError(payload, response.status);

      gatewayLogger.error(GATEWAY_LOG_CONTEXT, "Mercado Pago API request failed", {
        method,
        path,
        httpStatus: response.status,
        apiMessage: payload.message ?? payload.error ?? null,
        causes: payload.cause ?? null,
        details,
      });

      throw new PaymentGatewayError(
        `Mercado Pago API error: ${details}`,
        "MERCADOPAGO_API_ERROR",
      );
    }

    return payload;
  }
}

/**
 * Cria gateway a partir de `env.payment.mercadoPago`.
 * @returns Instância configurada.
 * @throws {Error} Se `MERCADOPAGO_ACCESS_TOKEN` não estiver definido.
 */
export function createMercadoPagoPixGatewayFromEnv(): MercadoPagoPixGateway {
  const accessToken = env.payment.mercadoPago.accessToken;
  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN is required when PAYMENT_GATEWAY=mercadopago");
  }

  return new MercadoPagoPixGateway(
    accessToken,
    env.payment.mercadoPago.apiBaseUrl,
    env.payment.mercadoPago.notificationUrl || undefined,
  );
}

function formatMercadoPagoApiError(
  payload: MercadoPagoPaymentResponse,
  httpStatus: number,
): string {
  const causeDetails =
    payload.cause
      ?.map((item) => {
        if (item.code && item.description) {
          return `${item.code}: ${item.description}`;
        }
        return item.description ?? item.code;
      })
      .filter(Boolean) ?? [];

  if (causeDetails.length > 0) {
    return causeDetails.join("; ");
  }

  return payload.message ?? payload.error ?? `HTTP ${httpStatus}`;
}

function mapMercadoPagoStatus(
  status: string,
): GatewayPaymentSnapshot["status"] {
  switch (status) {
    case "approved":
      return "approved";
    case "pending":
    case "in_process":
    case "authorized":
      return "pending";
    case "rejected":
      return "rejected";
    case "cancelled":
      return "cancelled";
    case "refunded":
    case "charged_back":
      return "failed";
    default:
      return "pending";
  }
}

function formatMercadoPagoExpiration(date: Date): string {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
  const minutes = String(absolute % 60).padStart(2, "0");

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  const millisecond = String(date.getMilliseconds()).padStart(3, "0");

  return `${year}-${month}-${day}T${hour}:${minute}:${second}.${millisecond}${sign}${hours}:${minutes}`;
}

/**
 * Type guard para usar métodos exclusivos do Mercado Pago.
 * @param gateway - Gateway genérico.
 * @returns `true` se o provedor for `mercadopago`.
 */
export function isMercadoPagoPixGateway(
  gateway: PaymentGateway,
): gateway is MercadoPagoPixGateway {
  return gateway.provider === "mercadopago";
}
