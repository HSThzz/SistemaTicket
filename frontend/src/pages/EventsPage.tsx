/**
 * @file Vitrine de eventos — layout inspirado no DICE.
 * @module pages/EventsPage
 */

import { useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconX } from "@tabler/icons-react";
import { DiceEventCard } from "../components/events/DiceEventCard";
import { EventsFilterBar } from "../components/events/EventsFilterBar";
import { EventsCategoryGrid } from "../components/events/EventsCategoryGrid";
import { EventsPromoBanner } from "../components/events/EventsPromoBanner";
import { EventsSearchBar } from "../components/events/EventsSearchBar";
import { useEventsFilters } from "../hooks/useEventsFilters";
import { usePublishedEvents } from "../hooks/usePublishedEvents";
import {
  extractCity,
  filterEvents,
  getLowestPrice,
  isEventSoon,
  isEventSoldOut,
  sortEvents,
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
  const { filters, setFilters, clearFilters, hasActiveFilters } = useEventsFilters();

  const cities = useMemo(() => {
    const unique = new Set(events.map((event) => extractCity(event.location)));
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [events]);

  const filteredEvents = useMemo(() => {
    let result = filterEvents(events, filters.query, filters.category);

    if (filters.city !== "all") {
      const normalizedCity = filters.city.toLowerCase();
      result = result.filter(
        (event) => extractCity(event.location).toLowerCase() === normalizedCity,
      );
    }

    if (filters.dateFilter === "soon") {
      result = result.filter((event) => isEventSoon(event));
    }

    if (filters.priceFilter === "free") {
      result = result.filter((event) => getLowestPrice(event) === 0);
    } else if (filters.priceFilter === "paid") {
      result = result.filter((event) => {
        const price = getLowestPrice(event);
        return price !== null && price > 0;
      });
    }

    if (filters.hideSoldOut) {
      result = result.filter((event) => !isEventSoldOut(event));
    }

    return sortEvents(result, filters.sort);
  }, [events, filters]);

  const sectionCityLabel =
    filters.city === "all"
      ? "Brasil"
      : filters.query.trim()
        ? "sua busca"
        : filters.city;

  return (
    <Box className="events-page events-page-section" w="100%">
      <Container size="xl" px="md" pb="xl">
        <Stack gap="xl">
          <Stack gap="lg" className="events-toolbar">
            <EventsSearchBar
              value={filters.query}
              onChange={(query) => setFilters({ query })}
            />
            <EventsFilterBar
              cities={cities}
              city={filters.city}
              onCityChange={(city) => setFilters({ city })}
              dateFilter={filters.dateFilter}
              onDateFilterChange={(dateFilter) => setFilters({ dateFilter })}
              priceFilter={filters.priceFilter}
              onPriceFilterChange={(priceFilter) => setFilters({ priceFilter })}
              sort={filters.sort}
              onSortChange={(sort) => setFilters({ sort })}
              hideSoldOut={filters.hideSoldOut}
              onHideSoldOutChange={(hideSoldOut) => setFilters({ hideSoldOut })}
              showClearFilters={hasActiveFilters}
              onClearFilters={clearFilters}
            />
            <EventsCategoryGrid
              value={filters.category}
              onChange={(category) => setFilters({ category })}
            />
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
              <Stack gap="sm">
                <Text size="sm">
                  {hasActiveFilters
                    ? "Nenhum evento corresponde aos filtros atuais."
                    : "Não há eventos publicados no momento. Volte em breve!"}
                </Text>
                {hasActiveFilters ? (
                  <Button
                    variant="light"
                    color="gray"
                    size="xs"
                    w="fit-content"
                    leftSection={<IconX size={14} />}
                    onClick={clearFilters}
                  >
                    Limpar filtros
                  </Button>
                ) : null}
              </Stack>
            </Alert>
          ) : null}

          {!loading && !error && filteredEvents.length > 0 ? (
            <Stack gap="lg">
              <Title order={2} className="events-page-heading">
                {hasActiveFilters ? (
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
