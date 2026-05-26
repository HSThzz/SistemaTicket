import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Container,
  Grid,
  Group,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconSparkles } from "@tabler/icons-react";
import { EventCard } from "../components/EventCard";
import { AnimatedSection } from "../components/home/AnimatedSection";
import { CategoryPills } from "../components/home/CategoryPills";
import { EventShelf } from "../components/home/EventShelf";
import { FaqSection } from "../components/home/FaqSection";
import { HeroCarousel } from "../components/home/HeroCarousel";
import { HomeSearchBar } from "../components/home/HomeSearchBar";
import { SiteFooter } from "../components/home/SiteFooter";
import { usePublishedEvents } from "../hooks/usePublishedEvents";
import {
  extractCity,
  filterEvents,
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
      <Box className="home-hero-bg home-hero-section" w="100%" pb="xl">
        <Container size="lg" px="md">
          <Stack gap="xl">
            <AnimatedSection>
              <Stack gap="sm" maw={560}>
                <Group gap="xs">
                  <IconSparkles size={28} color="var(--mantine-color-brand-6)" />
                  <Title
                    order={1}
                    style={{
                      fontSize: "clamp(2rem, 5vw, 3rem)",
                      lineHeight: 1.1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Descubra experiências{" "}
                    <Text span inherit c="brand">
                      incríveis
                    </Text>
                  </Title>
                </Group>
                <Text c="dimmed" size="lg">
                  Encontre shows, festivais e experiências. Compre com PIX e receba seu ingresso
                  na hora.
                </Text>
              </Stack>
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

      <Container size="lg" px="md" pb="xl">
        <Stack gap={48}>
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
              <EventShelf title="Esta semana" events={soonEvents} />
            </AnimatedSection>
          ) : null}

          {!hasActiveFilters
            ? Array.from(cityGroups.entries()).map(([city, cityEvents], index) => (
                <AnimatedSection key={city} delayMs={index * 60}>
                  <EventShelf title={`Em ${city}`} events={cityEvents} />
                </AnimatedSection>
              ))
            : null}

          {hasActiveFilters && filteredEvents.length > 0 ? (
            <AnimatedSection>
              <Stack gap="md">
                <Title order={2} size="h3">
                  Resultados
                </Title>
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

          <AnimatedSection>
            <FaqSection />
          </AnimatedSection>
        </Stack>
      </Container>

      <SiteFooter />
    </>
  );
}
