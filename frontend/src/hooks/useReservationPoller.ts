import { useCallback, useEffect, useRef, useState } from "react";
import * as purchaseService from "../services/purchaseService";
import type { ReservationStatusView } from "../types/api";
import { getApiErrorMessage } from "../utils/errors";

const DEFAULT_INTERVAL_MS = 1500;

interface UseReservationPollerOptions {
  reservationId: string | null;
  enabled?: boolean;
  intervalMs?: number;
  stopOn?: Set<ReservationStatusView["phase"]>;
}

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

export function useReservationPoller({
  reservationId,
  enabled = true,
  intervalMs = DEFAULT_INTERVAL_MS,
  stopOn = purchaseService.TERMINAL_PHASES,
}: UseReservationPollerOptions) {
  const [status, setStatus] = useState<ReservationStatusView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const stopOnRef = useRef(stopOn);
  const isFirstPollRef = useRef(true);

  stopOnRef.current = stopOn;

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
      await pollOnce();
    } catch (err) {
      setError(getApiErrorMessage(err, "Falha ao consultar reserva."));
    } finally {
      setLoading(false);
    }
  }, [pollOnce, reservationId]);

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

        if (next && !stopOnRef.current.has(next.phase)) {
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
  }, [enabled, reservationId, intervalMs, pollOnce, stopOn, clearTimer]);

  return { status, loading, error, refresh };
}
