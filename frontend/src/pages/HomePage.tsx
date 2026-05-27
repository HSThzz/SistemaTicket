import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Container,
  Grid,
  SimpleGrid,
  Stack,
  Skeleton,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconCalendar, IconMapPin, IconTicket } from "@tabler/icons-react";
import { EventCard } from "../components/EventCard";
import { AnimatedSection } from "../components/home/AnimatedSection";
import { CategoryPills } from "../components/home/CategoryPills";
import { EventShelf } from "../components/home/EventShelf";
import { FaqSection } from "../components/home/FaqSection";
import { HeroCarousel } from "../components/home/HeroCarousel";
import { HomeHero } from "../components/home/HomeHero";
import { HomeProducerCta } from "../components/home/HomeProducerCta";
import { HomeSearchBar } from "../components/home/HomeSearchBar";
import { HomeValueProps } from "../components/home/HomeValueProps";
import { SiteFooter } from "../components/home/SiteFooter";
import { StatCard } from "../components/account/StatCard";
import { usePublishedEvents } from "../hooks/usePublishedEvents";
import {
  extractCity,
  filterEvents,
  getTotalAvailable,
  groupEventsByCity,
  isEventSoon,
  type EventCategory,
} from "../utils/eventVisuals";

function HomePageSkeleton() {
  return (
    <Stack gap="xl">
      <Skeleton height={380} radius="xl" className="skeleton-shimmer" />
      <Skeleton height={56} radius="xl" className="skeleton-shimmer" />
      <Grid>
        {Array.from({ length: 6 }).map((_, index) => (
          <Grid.Col key={index} span={{ base: 12, sm: 6, lg: 4 }}>
            <Skeleton height={280} radius="lg" className="skeleton-shimmer" />
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  );
}

export function HomePage() {
  const { events, loading, error } = usePublishedEvents();
  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [category, setCategory] = useState<EventCategory>("all");

  const filteredEvents = useMemo(() => {
    const bySearch = filterEvents(events, query, category);

    if (!locationFilter.trim()) {
      return bySearch;
    }

    const normalizedLocation = locationFilter.trim().toLowerCase();
    return bySearch.filter((event) => {
      const city = extractCity(event.location).toLowerCase();
      return (
        city.includes(normalizedLocation) ||
        event.location.toLowerCase().includes(normalizedLocation)
      );
    });
  }, [events, query, category, locationFilter]);

  const soonEvents = useMemo(
    () => filteredEvents.filter((event) => isEventSoon(event)),
    [filteredEvents],
  );

  const cityGroups = useMemo(
    () => groupEventsByCity(filteredEvents),
    [filteredEvents],
  );

  const hasActiveFilters =
    query.trim().length > 0 || locationFilter.trim().length > 0 || category !== "all";

  const homeStats = useMemo(() => {
    const cities = new Set(events.map((event) => extractCity(event.location)));
    const thisWeek = events.filter((event) => isEventSoon(event)).length;
    const available = events.reduce((sum, event) => sum + getTotalAvailable(event), 0);

    return {
      total: events.length,
      cities: cities.size,
      thisWeek,
      available,
    };
  }, [events]);

  if (loading) {
    return (
      <Box className="home-hero-bg home-hero-section" w="100%" pb="xl">
        <Container size="lg" px="md">
          <HomePageSkeleton />
        </Container>
      </Box>
    );
  }

  return (
    <>
      <Box className="home-hero-bg home-hero-section" w="100%">
        <Container size="lg" px="md" pb="xl">
          <Stack gap="xl">
            <AnimatedSection>
              <HomeHero eventCount={events.length} />
            </AnimatedSection>

            <AnimatedSection delayMs={80}>
              <HomeSearchBar
                query={query}
                location={locationFilter}
                onQueryChange={setQuery}
                onLocationChange={setLocationFilter}
              />
            </AnimatedSection>

            {!hasActiveFilters && filteredEvents.length > 0 ? (
              <AnimatedSection delayMs={120}>
                <HeroCarousel events={filteredEvents} />
              </AnimatedSection>
            ) : null}

            <AnimatedSection delayMs={160}>
              <CategoryPills value={category} onChange={setCategory} />
            </AnimatedSection>
          </Stack>
        </Container>
      </Box>

      <Box className="home-content-area">
        <Container size="lg" px="md" py="xl">
          <Stack gap={56}>
            {!hasActiveFilters && events.length > 0 ? (
              <AnimatedSection delayMs={40}>
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                  <StatCard
                    label="Eventos"
                    value={String(homeStats.total)}
                    icon={<IconTicket size={20} />}
                  />
                  <StatCard
                    label="Cidades"
                    value={String(homeStats.cities)}
                    icon={<IconMapPin size={20} />}
                    iconColor="grape"
                    valueColor="grape"
                  />
                  <StatCard
                    label="Esta semana"
                    value={String(homeStats.thisWeek)}
                    icon={<IconCalendar size={20} />}
                    iconColor="blue"
                    valueColor="blue"
                  />
                  <StatCard
                    label="Ingressos"
                    value={String(homeStats.available)}
                    icon={<IconTicket size={20} />}
                    iconColor="teal"
                    valueColor="teal"
                  />
                </SimpleGrid>
              </AnimatedSection>
            ) : null}

            {error ? (
              <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro ao carregar">
                {error}
              </Alert>
            ) : null}

            {!error && filteredEvents.length === 0 ? (
              <Alert icon={<IconAlertCircle size={18} />} color="gray" title="Nenhum evento encontrado">
                {hasActiveFilters
                  ? "Tente outros filtros ou limpe a busca."
                  : "Não há eventos publicados no momento. Volte em breve!"}
              </Alert>
            ) : null}

            {!hasActiveFilters && soonEvents.length > 0 ? (
              <AnimatedSection>
                <EventShelf
                  title="Esta semana"
                  subtitle="Eventos nos próximos 7 dias — não deixe passar."
                  events={soonEvents}
                />
              </AnimatedSection>
            ) : null}

            {!hasActiveFilters
              ? Array.from(cityGroups.entries()).map(([city, cityEvents], index) => (
                  <AnimatedSection key={city} delayMs={index * 60}>
                    <EventShelf
                      title={`Em ${city}`}
                      subtitle={`${cityEvents.length} evento${cityEvents.length === 1 ? "" : "s"} nesta região.`}
                      events={cityEvents}
                    />
                  </AnimatedSection>
                ))
              : null}

            {hasActiveFilters && filteredEvents.length > 0 ? (
              <AnimatedSection>
                <Stack gap="lg">
                  <Stack gap={4}>
                    <Title order={2} size="h3" className="home-section-title">
                      Resultados
                    </Title>
                    <Text c="dimmed" size="sm">
                      {filteredEvents.length} evento{filteredEvents.length === 1 ? "" : "s"} encontrado
                      {filteredEvents.length === 1 ? "" : "s"} para sua busca.
                    </Text>
                  </Stack>
                  <Grid>
                    {filteredEvents.map((event) => (
                      <Grid.Col key={event.id} span={{ base: 12, sm: 6, lg: 4 }}>
                        <EventCard event={event} />
                      </Grid.Col>
                    ))}
                  </Grid>
                </Stack>
              </AnimatedSection>
            ) : null}

            {!hasActiveFilters ? <HomeValueProps /> : null}

            <HomeProducerCta />

            <AnimatedSection>
              <FaqSection />
            </AnimatedSection>
          </Stack>
        </Container>
      </Box>

      <SiteFooter />
    </>
  );
}
