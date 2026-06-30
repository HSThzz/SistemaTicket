/**
 * @file Hook para carregar a lista de eventos publicados na vitrine.
 * @module hooks/usePublishedEvents
 */

import { useEffect, useState } from "react";
import * as eventService from "@/modules/catalog/api/eventService";
import type { Event } from "@/shared/types/api";
import { getApiErrorMessage } from "@/shared/utils/errors";

/**
 * Busca eventos publicados na montagem e expõe estado de carregamento e erro.
 *
 * @returns Objeto com `events`, `loading` e `error` (mensagem ou `null`).
 */
export function usePublishedEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    eventService
      .listPublishedEvents()
      .then((data) => {
        if (!cancelled) {
          setEvents(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Não foi possível carregar os eventos."));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { events, loading, error };
}
