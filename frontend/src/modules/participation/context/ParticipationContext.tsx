/**
 * @file Contexto React com status de solicitações de participação do usuário.
 * @module context/ParticipationContext
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as participationService from "@/modules/participation/api/participationService";
import type { ParticipationRequestStatus } from "@/shared/types/api";
import { useAuth } from "@/modules/identity/context/AuthContext";

interface ParticipationContextValue {
  getParticipationStatus: (eventId: string) => ParticipationRequestStatus | null;
  setParticipationStatus: (eventId: string, status: ParticipationRequestStatus) => void;
  isReady: boolean;
}

const ParticipationContext = createContext<ParticipationContextValue | null>(null);

export function ParticipationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id;
  const [statusByEventId, setStatusByEventId] = useState<
    Record<string, ParticipationRequestStatus>
  >({});
  const [isReady, setIsReady] = useState(!isAuthenticated);

  useEffect(() => {
    if (!userId) {
      setStatusByEventId({});
      setIsReady(true);
      return;
    }

    let cancelled = false;

    setIsReady(false);

    participationService
      .listMyParticipationRequests()
      .then((requests) => {
        if (cancelled) {
          return;
        }

        const next: Record<string, ParticipationRequestStatus> = {};
        for (const request of requests) {
          next[request.eventId] = request.status as ParticipationRequestStatus;
        }
        setStatusByEventId(next);
      })
      .catch(() => {
        if (!cancelled) {
          setStatusByEventId({});
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const getParticipationStatus = useCallback(
    (eventId: string) => statusByEventId[eventId] ?? null,
    [statusByEventId],
  );

  const setParticipationStatus = useCallback(
    (eventId: string, status: ParticipationRequestStatus) => {
      setStatusByEventId((current) => ({
        ...current,
        [eventId]: status,
      }));
    },
    [],
  );

  const value = useMemo(
    () => ({
      getParticipationStatus,
      setParticipationStatus,
      isReady,
    }),
    [getParticipationStatus, setParticipationStatus, isReady],
  );

  return (
    <ParticipationContext.Provider value={value}>{children}</ParticipationContext.Provider>
  );
}

export function useParticipation(): ParticipationContextValue {
  const context = useContext(ParticipationContext);

  if (!context) {
    throw new Error("useParticipation must be used within ParticipationProvider");
  }

  return context;
}
