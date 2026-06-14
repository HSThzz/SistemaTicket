/**
 * @file Hook que carrega o SDK MercadoPago.js (v2) e expõe tokenização de cartão.
 * @module hooks/useMercadoPago
 *
 * Os dados sensíveis do cartão (número, CVV, validade) são tokenizados pelo
 * próprio SDK do Mercado Pago no navegador e nunca trafegam pelo nosso back-end.
 */

import { useEffect, useRef, useState } from "react";
import { loadMercadoPago } from "@mercadopago/sdk-js";
import { api } from "../shared/api/client";

/** Dados brutos do cartão usados apenas para gerar o token no navegador. */
export interface CardTokenData {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  identificationType: string;
  identificationNumber: string;
}

/** Opção de parcelamento retornada pelo Mercado Pago. */
export interface InstallmentOption {
  installments: number;
  label: string;
}

interface MercadoPagoInstance {
  createCardToken(data: CardTokenData): Promise<{ id: string }>;
  getPaymentMethods(params: { bin: string }): Promise<{
    results: Array<{ id: string; name: string }>;
  }>;
  getInstallments(params: {
    amount: string;
    bin: string;
    paymentTypeId: string;
  }): Promise<
    Array<{
      payer_costs: Array<{ installments: number; recommended_message: string }>;
    }>
  >;
}

declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      options?: { locale?: string },
    ) => MercadoPagoInstance;
  }
}

interface PaymentConfigResponse {
  mercadoPagoPublicKey: string | null;
  mercadoPagoEnabled: boolean;
  cardPaymentEnabled: boolean;
}

async function resolvePublicKey(): Promise<string> {
  const fromEnv = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  try {
    const { data } = await api.get<PaymentConfigResponse>("/payments/config");
    return data.mercadoPagoPublicKey?.trim() ?? "";
  } catch {
    return "";
  }
}

/** Estado de carregamento e API do SDK do Mercado Pago. */
export interface UseMercadoPagoResult {
  /** Carregando public key ou SDK. */
  loading: boolean;
  ready: boolean;
  /** `false` quando nenhuma public key está disponível. */
  available: boolean;
  error: string | null;
  /** Gera o `card_token` a partir dos dados do cartão (somente no navegador). */
  createCardToken: (data: CardTokenData) => Promise<string>;
  /** Detecta o `payment_method_id` (bandeira) pelos primeiros dígitos do cartão. */
  detectPaymentMethodId: (bin: string) => Promise<string | null>;
  /** Lista opções de parcelamento para um valor (em reais) e BIN do cartão. */
  fetchInstallments: (amountReais: number, bin: string) => Promise<InstallmentOption[]>;
}

/**
 * Carrega o SDK do Mercado Pago uma única vez e devolve helpers de tokenização.
 */
export function useMercadoPago(): UseMercadoPagoResult {
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mpRef = useRef<MercadoPagoInstance | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      setError(null);

      const publicKey = await resolvePublicKey();

      if (cancelled) {
        return;
      }

      if (!publicKey) {
        setAvailable(false);
        setReady(false);
        setLoading(false);
        return;
      }

      setAvailable(true);

      try {
        await loadMercadoPago();

        if (cancelled || !window.MercadoPago) {
          return;
        }

        mpRef.current = new window.MercadoPago(publicKey, { locale: "pt-BR" });
        setReady(true);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar o Mercado Pago.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const createCardToken = async (data: CardTokenData): Promise<string> => {
    if (!mpRef.current) {
      throw new Error("Mercado Pago não está pronto.");
    }
    const token = await mpRef.current.createCardToken(data);
    if (!token?.id) {
      throw new Error("Não foi possível gerar o token do cartão.");
    }
    return token.id;
  };

  const detectPaymentMethodId = async (bin: string): Promise<string | null> => {
    if (!mpRef.current || bin.length < 6) {
      return null;
    }
    try {
      const response = await mpRef.current.getPaymentMethods({ bin });
      return response.results[0]?.id ?? null;
    } catch {
      return null;
    }
  };

  const fetchInstallments = async (
    amountReais: number,
    bin: string,
  ): Promise<InstallmentOption[]> => {
    if (!mpRef.current || bin.length < 6) {
      return [];
    }
    try {
      const response = await mpRef.current.getInstallments({
        amount: amountReais.toFixed(2),
        bin,
        paymentTypeId: "credit_card",
      });
      const payerCosts = response[0]?.payer_costs ?? [];
      return payerCosts.map((cost) => ({
        installments: cost.installments,
        label: cost.recommended_message,
      }));
    } catch {
      return [];
    }
  };

  return {
    loading,
    ready,
    available,
    error,
    createCardToken,
    detectPaymentMethodId,
    fetchInstallments,
  };
}
