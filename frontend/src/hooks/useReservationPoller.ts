/**
 * @file Hook de polling do status de reserva durante checkout e pagamento.
 * @module hooks/useReservationPoller
 */

import { useCallback, useEffect, useRef, useState } from "react";
import * as purchaseService from "../features/sales/api/purchaseService";
import type { ReservationStatusView } from "../types/api";
import { getApiErrorMessage } from "../utils/errors";

const DEFAULT_INTERVAL_MS = 1500;

/** Opções de configuração do poller de reserva. */
interface UseReservationPollerOptions {
  /** ID da reserva a monitorar; polling desligado se `null`. */
  reservationId: string | null;
  /** Se `false`, interrompe consultas periódicas. */
  enabled?: boolean;
  /** Intervalo entre consultas em milissegundos. */
  intervalMs?: number;
  /**
   * Define se o polling deve continuar após uma fase.
   * Quando omitido, continua até fase terminal.
   */
  shouldContinuePolling?: (phase: ReservationStatusView["phase"]) => boolean;
}

/**
 * Compara dois status para evitar re-render quando nada relevante mudou.
 *
 * @param previous - Status anterior ou `null` na primeira leitura.
 * @param next - Status recém-obtido da API.
 */
function isSameStatus(
  previous: ReservationStatusView | null,
  next: ReservationStatusView,
): boolean {
  if (!previous) {
    return false;
  }

  if (previous.phase !== next.phase) {
    return false;
  }

  if (previous.order?.id !== next.order?.id) {
    return false;
  }

  if (previous.payment?.pixCopyPaste !== next.payment?.pixCopyPaste) {
    return false;
  }

  if (previous.payment?.expiresAt !== next.payment?.expiresAt) {
    return false;
  }

  return previous.payment?.amountCents === next.payment?.amountCents;
}

const defaultShouldContinue = (phase: ReservationStatusView["phase"]) =>
  !purchaseService.TERMINAL_PHASES.has(phase);

/**
 * Consulta periodicamente o status da reserva até `shouldContinuePolling` retornar `false`.
 *
 * @param options - ID da reserva, intervalo e regra de continuação.
 * @returns `status` atual, flags `loading`/`error` e função `refresh` manual.
 */
export function useReservationPoller({
  reservationId,
  enabled = true,
  intervalMs = DEFAULT_INTERVAL_MS,
  shouldContinuePolling = defaultShouldContinue,
}: UseReservationPollerOptions) {
  const [status, setStatus] = useState<ReservationStatusView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const shouldContinueRef = useRef(shouldContinuePolling);
  const scheduleRef = useRef<(delay: number) => void>(() => {});
  const isFirstPollRef = useRef(true);

  shouldContinueRef.current = shouldContinuePolling;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pollOnce = useCallback(async () => {
    if (!reservationId) {
      return null;
    }

    const next = await purchaseService.getReservationStatus(reservationId);
    setStatus((previous) => (isSameStatus(previous, next) ? previous : next));
    return next;
  }, [reservationId]);

  const refresh = useCallback(async () => {
    if (!reservationId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const next = await pollOnce();
      if (next && shouldContinueRef.current(next.phase)) {
        scheduleRef.current(intervalMs);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Falha ao consultar reserva."));
      scheduleRef.current(intervalMs);
    } finally {
      setLoading(false);
    }
  }, [intervalMs, pollOnce, reservationId]);

  useEffect(() => {
    isFirstPollRef.current = true;
    setStatus(null);
    setError(null);
  }, [reservationId]);

  useEffect(() => {
    if (!enabled || !reservationId) {
      clearTimer();
      return;
    }

    let cancelled = false;

    const schedule = (delay: number) => {
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        void tick();
      }, delay);
    };

    scheduleRef.current = schedule;

    const tick = async () => {
      if (cancelled) {
        return;
      }

      const showLoading = isFirstPollRef.current;

      try {
        if (showLoading) {
          setLoading(true);
        }

        const next = await pollOnce();
        setError(null);

        if (next && shouldContinueRef.current(next.phase)) {
          schedule(intervalMs);
        }
      } catch (err) {
        setError(getApiErrorMessage(err, "Falha ao consultar reserva."));
        schedule(intervalMs);
      } finally {
        if (showLoading) {
          setLoading(false);
          isFirstPollRef.current = false;
        }
      }
    };

    void tick();

    return () => {
      cancelled = true;
      clearTimer();
    };
  }, [enabled, reservationId, intervalMs, pollOnce, clearTimer]);

  return { status, loading, error, refresh };
}
