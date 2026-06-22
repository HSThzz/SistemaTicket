/**
 * @file Estado dos filtros da vitrine de eventos sincronizado com a URL.
 * @module hooks/useEventsFilters
 */

import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { EventsDateFilter, EventsPriceFilter } from "../components/events/EventsFilterBar";
import type { EventCategory, EventsSort } from "../utils/eventVisuals";
import type { EventTypeFilter } from "../utils/eventTypeFilter";

export interface EventsFilters {
  query: string;
  city: string | "all";
  category: EventCategory;
  dateFilter: EventsDateFilter;
  priceFilter: EventsPriceFilter;
  sort: EventsSort;
  hideSoldOut: boolean;
  typeFilter: EventTypeFilter;
}

export const DEFAULT_EVENTS_FILTERS: EventsFilters = {
  query: "",
  city: "all",
  category: "all",
  dateFilter: "all",
  priceFilter: "all",
  sort: "date",
  hideSoldOut: false,
  typeFilter: "all",
};

const VALID_CATEGORIES = new Set<EventCategory>([
  "all",
  "festival",
  "show",
  "corporate",
  "online",
]);

const VALID_DATE_FILTERS = new Set<EventsDateFilter>(["all", "soon"]);
const VALID_PRICE_FILTERS = new Set<EventsPriceFilter>(["all", "free", "paid"]);
const VALID_SORTS = new Set<EventsSort>(["date", "price_asc", "price_desc"]);
const VALID_TYPE_FILTERS = new Set<EventTypeFilter>(["all", "public", "private"]);

function parseFilters(params: URLSearchParams): EventsFilters {
  const category = params.get("cat");
  const dateFilter = params.get("date");
  const priceFilter = params.get("price");
  const sort = params.get("sort");
  const typeFilter = params.get("access");

  return {
    query: params.get("q") ?? "",
    city: params.get("city") ?? "all",
    category:
      category && VALID_CATEGORIES.has(category as EventCategory)
        ? (category as EventCategory)
        : "all",
    dateFilter:
      dateFilter && VALID_DATE_FILTERS.has(dateFilter as EventsDateFilter)
        ? (dateFilter as EventsDateFilter)
        : "all",
    priceFilter:
      priceFilter && VALID_PRICE_FILTERS.has(priceFilter as EventsPriceFilter)
        ? (priceFilter as EventsPriceFilter)
        : "all",
    sort: sort && VALID_SORTS.has(sort as EventsSort) ? (sort as EventsSort) : "date",
    hideSoldOut: params.get("available") === "1",
    typeFilter:
      typeFilter && VALID_TYPE_FILTERS.has(typeFilter as EventTypeFilter)
        ? (typeFilter as EventTypeFilter)
        : "all",
  };
}

function writeFilters(params: URLSearchParams, filters: EventsFilters) {
  params.delete("q");
  params.delete("city");
  params.delete("cat");
  params.delete("date");
  params.delete("price");
  params.delete("sort");
  params.delete("available");
  params.delete("access");

  const trimmedQuery = filters.query.trim();
  if (trimmedQuery) {
    params.set("q", trimmedQuery);
  }
  if (filters.city !== "all") {
    params.set("city", filters.city);
  }
  if (filters.category !== "all") {
    params.set("cat", filters.category);
  }
  if (filters.dateFilter !== "all") {
    params.set("date", filters.dateFilter);
  }
  if (filters.priceFilter !== "all") {
    params.set("price", filters.priceFilter);
  }
  if (filters.sort !== "date") {
    params.set("sort", filters.sort);
  }
  if (filters.hideSoldOut) {
    params.set("available", "1");
  }
  if (filters.typeFilter !== "all") {
    params.set("access", filters.typeFilter);
  }
}

export function useEventsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<EventsFilters>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          writeFilters(next, { ...parseFilters(current), ...patch });
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const hasActiveFilters =
    filters.query.trim().length > 0 ||
    filters.city !== "all" ||
    filters.category !== "all" ||
    filters.dateFilter !== "all" ||
    filters.priceFilter !== "all" ||
    filters.sort !== "date" ||
    filters.hideSoldOut ||
    filters.typeFilter !== "all";

  return { filters, setFilters, clearFilters, hasActiveFilters };
}
