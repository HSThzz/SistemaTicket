/**
 * @file Persistência local de eventos favoritos por usuário.
 * @module hooks/useFavorites
 */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const STORAGE_PREFIX = "vibra:favorites";

function readFavorites(userId: string): string[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}:${userId}`);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function writeFavorites(userId: string, ids: string[]) {
  localStorage.setItem(`${STORAGE_PREFIX}:${userId}`, JSON.stringify(ids));
}

/** Gerencia favoritos do usuário autenticado em localStorage. */
export function useFavorites() {
  const { user } = useAuth();
  const userId = user?.id;
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    userId ? readFavorites(userId) : [],
  );

  useEffect(() => {
    if (userId) {
      setFavoriteIds(readFavorites(userId));
    } else {
      setFavoriteIds([]);
    }
  }, [userId]);

  const isFavorite = useCallback(
    (eventId: string) => favoriteIds.includes(eventId),
    [favoriteIds],
  );

  const toggleFavorite = useCallback(
    (eventId: string) => {
      if (!userId) {
        return;
      }

      setFavoriteIds((current) => {
        const next = current.includes(eventId)
          ? current.filter((id) => id !== eventId)
          : [...current, eventId];
        writeFavorites(userId, next);
        return next;
      });
    },
    [userId],
  );

  return { favoriteIds, isFavorite, toggleFavorite };
}
