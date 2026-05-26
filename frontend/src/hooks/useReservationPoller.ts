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
    setStatus(next);
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

      try {
        setLoading(true);
        const next = await pollOnce();
        setError(null);

        if (next && !stopOn.has(next.phase)) {
          schedule(intervalMs);
        }
      } catch (err) {
        setError(getApiErrorMessage(err, "Falha ao consultar reserva."));
        schedule(intervalMs);
      } finally {
        setLoading(false);
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
