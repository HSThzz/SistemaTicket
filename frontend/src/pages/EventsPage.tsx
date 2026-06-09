/**
 * @file Vitrine de eventos — layout inspirado no DICE.
 * @module pages/EventsPage
 */

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Container,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { DiceEventCard } from "../components/events/DiceEventCard";
import {
  EventsFilterBar,
  type EventsDateFilter,
  type EventsPriceFilter,
} from "../components/events/EventsFilterBar";
import { EventsCategoryGrid } from "../components/events/EventsCategoryGrid";
import { EventsPromoBanner } from "../components/events/EventsPromoBanner";
import { EventsSearchBar } from "../components/events/EventsSearchBar";
import { usePublishedEvents } from "../hooks/usePublishedEvents";
import {
  extractCity,
  filterEvents,
  getLowestPrice,
  isEventSoon,
  type EventCategory,
} from "../utils/eventVisuals";

function EventsPageSkeleton() {
  return (
    <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
      {Array.from({ length: 8 }).map((_, index) => (
        <Stack key={index} gap="sm">
          <Skeleton height={180} radius="md" className="skeleton-shimmer" />
          <Skeleton height={14} radius="sm" className="skeleton-shimmer" />
          <Skeleton height={12} width="55%" radius="sm" className="skeleton-shimmer" />
        </Stack>
      ))}
    </SimpleGrid>
  );
}

export function EventsPage() {
  const { events, loading, error } = usePublishedEvents();
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<string | "all">("all");
  const [category, setCategory] = useState<EventCategory>("all");
  const [dateFilter, setDateFilter] = useState<EventsDateFilter>("all");
  const [priceFilter, setPriceFilter] = useState<EventsPriceFilter>("all");

  const cities = useMemo(() => {
    const unique = new Set(events.map((event) => extractCity(event.location)));
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [events]);

  const filteredEvents = useMemo(() => {
    let result = filterEvents(events, query, category);

    if (cityFilter !== "all") {
      const normalizedCity = cityFilter.toLowerCase();
      result = result.filter(
        (event) => extractCity(event.location).toLowerCase() === normalizedCity,
      );
    }

    if (dateFilter === "soon") {
      result = result.filter((event) => isEventSoon(event));
    }

    if (priceFilter === "free") {
      result = result.filter((event) => getLowestPrice(event) === 0);
    } else if (priceFilter === "paid") {
      result = result.filter((event) => {
        const price = getLowestPrice(event);
        return price !== null && price > 0;
      });
    }

    return result;
  }, [events, query, category, cityFilter, dateFilter, priceFilter]);

  const sectionCityLabel =
    cityFilter === "all" ? "Brasil" : query.trim() ? "sua busca" : cityFilter;

  const hasActiveFilters =
    query.trim().length > 0 ||
    cityFilter !== "all" ||
    category !== "all" ||
    dateFilter !== "all" ||
    priceFilter !== "all";

  return (
    <Box className="events-page events-page-section" w="100%">
      <Container size="xl" px="md" pb="xl">
        <Stack gap="xl">
          <Stack gap="lg" className="events-toolbar">
            <EventsSearchBar value={query} onChange={setQuery} />
            <EventsFilterBar
              cities={cities}
              city={cityFilter}
              onCityChange={setCityFilter}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              priceFilter={priceFilter}
              onPriceFilterChange={setPriceFilter}
            />
            <EventsCategoryGrid value={category} onChange={setCategory} />
          </Stack>

          <EventsPromoBanner />

          {loading ? <EventsPageSkeleton /> : null}

          {error ? (
            <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro ao carregar">
              {error}
            </Alert>
          ) : null}

          {!loading && !error && filteredEvents.length === 0 ? (
            <Alert icon={<IconAlertCircle size={18} />} color="gray" title="Nenhum evento encontrado">
              {hasActiveFilters
                ? "Tente outros filtros ou limpe a busca."
                : "Não há eventos publicados no momento. Volte em breve!"}
            </Alert>
          ) : null}

          {!loading && !error && filteredEvents.length > 0 ? (
            <Stack gap="lg">
              <Title order={2} className="events-page-heading">
                {hasActiveFilters && query.trim() ? (
                  <>
                    Resultados{" "}
                    <Text span inherit className="events-page-heading-muted">
                      · {filteredEvents.length} evento{filteredEvents.length === 1 ? "" : "s"}
                    </Text>
                  </>
                ) : (
                  <>
                    Eventos populares{" "}
                    <Text span inherit className="events-page-heading-muted">
                      em {sectionCityLabel}
                    </Text>
                  </>
                )}
              </Title>

              <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
                {filteredEvents.map((event) => (
                  <DiceEventCard key={event.id} event={event} />
                ))}
              </SimpleGrid>
            </Stack>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}
