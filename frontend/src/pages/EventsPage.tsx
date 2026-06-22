/**
 * @file Vitrine de eventos — layout inspirado no DICE.
 * @module pages/EventsPage
 */

import { useEffect, useMemo } from "react";
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
import { useMediaQuery } from "@mantine/hooks";
import { IconAlertCircle, IconX } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useSearchParams } from "react-router-dom";
import { DiceEventCard } from "../components/events/DiceEventCard";
import { EventsFilterBar } from "../components/events/EventsFilterBar";
import { EventsFiltersDrawer } from "../components/events/EventsFiltersDrawer";
import { EventsCategoryGrid } from "../components/events/EventsCategoryGrid";
import { EventsPromoBanner } from "../components/events/EventsPromoBanner";
import { EventsSearchBar } from "../components/events/EventsSearchBar";
import { EventsSpotifySection } from "../components/events/EventsSpotifySection";
import { useEventsFilters } from "../hooks/useEventsFilters";
import { usePublishedEvents } from "../hooks/usePublishedEvents";
import { useSpotifyConnection } from "../hooks/useSpotifyConnection";
import {
  extractCity,
  filterEvents,
  getLowestPrice,
  isEventSoon,
  isEventSoldOut,
  sortEvents,
} from "../utils/eventVisuals";
import { filterEventsByType } from "../utils/eventTypeFilter";

function EventsPageSkeleton() {
  return (
    <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, lg: 4 }} spacing="md">
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

function countActiveFilters(filters: ReturnType<typeof useEventsFilters>["filters"]): number {
  let count = 0;
  if (filters.query.trim()) count += 1;
  if (filters.city !== "all") count += 1;
  if (filters.category !== "all") count += 1;
  if (filters.dateFilter !== "all") count += 1;
  if (filters.priceFilter !== "all") count += 1;
  if (filters.hideSoldOut) count += 1;
  if (filters.sort !== "date") count += 1;
  if (filters.typeFilter !== "all") count += 1;
  return count;
}

export function EventsPage() {
  const isMobile = useMediaQuery("(max-width: 47.99em)");
  const [searchParams, setSearchParams] = useSearchParams();
  const { events, loading, error } = usePublishedEvents();
  const { filters, setFilters, clearFilters, hasActiveFilters } = useEventsFilters();
  const spotify = useSpotifyConnection();

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

    result = filterEventsByType(result, filters.typeFilter);

    return sortEvents(result, filters.sort);
  }, [events, filters]);

  const sectionCityLabel =
    filters.city === "all"
      ? "Brasil"
      : filters.query.trim()
        ? "sua busca"
        : filters.city;

  const activeFiltersCount = countActiveFilters(filters);

  useEffect(() => {
    const spotifyStatus = searchParams.get("spotify");
    if (!spotifyStatus) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("spotify");
    nextParams.delete("spotify_message");
    setSearchParams(nextParams, { replace: true });

    if (spotifyStatus === "connected") {
      notifications.show({
        title: "Spotify conectado",
        message: "Carregando recomendações com base nos seus artistas.",
        color: "green",
      });
      void spotify.refreshStatus();
      return;
    }

    notifications.show({
      title: "Não foi possível conectar",
      message: "A autorização do Spotify foi cancelada ou falhou.",
      color: "red",
    });
  }, [searchParams, setSearchParams, spotify.refreshStatus]);

  return (
    <Box className="events-page events-page-section" w="100%">
      <Container size="xl" px="md" pb="xl" className="events-page-container">
        <Stack gap="xl">
          <Stack gap="md" className="events-toolbar">
            <EventsSearchBar
              value={filters.query}
              onChange={(query) => setFilters({ query })}
            />

            {isMobile ? (
              <EventsFiltersDrawer
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
                typeFilter={filters.typeFilter}
                onTypeFilterChange={(typeFilter) => setFilters({ typeFilter })}
                category={filters.category}
                onCategoryChange={(category) => setFilters({ category })}
                activeFiltersCount={activeFiltersCount}
                onClearFilters={clearFilters}
              />
            ) : (
              <>
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
                  typeFilter={filters.typeFilter}
                  onTypeFilterChange={(typeFilter) => setFilters({ typeFilter })}
                  showClearFilters={hasActiveFilters}
                  onClearFilters={clearFilters}
                />
                <EventsCategoryGrid
                  value={filters.category}
                  onChange={(category) => setFilters({ category })}
                />
              </>
            )}
          </Stack>

          <EventsPromoBanner
            status={spotify.status}
            loadingStatus={spotify.loadingStatus}
            connecting={spotify.connecting}
            disconnecting={spotify.disconnecting}
            onConnect={spotify.connect}
            onDisconnect={spotify.disconnect}
          />

          {spotify.status.connected ? (
            <EventsSpotifySection
              events={spotify.recommendations?.events ?? []}
              topArtists={spotify.recommendations?.artists ?? []}
              loading={spotify.loadingRecommendations}
            />
          ) : null}

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

              <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, lg: 4 }} spacing="md">
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
