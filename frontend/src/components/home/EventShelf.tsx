import { Link } from "react-router-dom";
import { Anchor, Badge, Box, Group, Stack, Text, Title } from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { IconChevronRight } from "@tabler/icons-react";
import { EventCard } from "../EventCard";
import type { Event } from "../../types/api";

interface EventShelfProps {
  title: string;
  subtitle?: string;
  events: Event[];
  viewAllHref?: string;
}

export function EventShelf({ title, subtitle, events, viewAllHref }: EventShelfProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <Stack gap="lg" className="home-event-shelf">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
        <Stack gap={4}>
          <Group gap="sm" align="center">
            <Title order={2} size="h3" className="home-section-title">
              {title}
            </Title>
            <Badge variant="light" color="brand" radius="sm" size="lg">
              {events.length}
            </Badge>
          </Group>
          {subtitle ? (
            <Text c="dimmed" size="sm">
              {subtitle}
            </Text>
          ) : null}
        </Stack>
        {viewAllHref ? (
          <Anchor
            component={Link}
            to={viewAllHref}
            c="brand"
            fw={600}
            size="sm"
            underline="never"
            className="home-shelf-link"
          >
            Ver tudo
            <IconChevronRight size={16} />
          </Anchor>
        ) : null}
      </Group>

      <Box hiddenFrom="sm">
        <Stack gap="md">
          {events.map((event) => (
            <EventCard key={event.id} event={event} variant="horizontal" />
          ))}
        </Stack>
      </Box>

      <Box visibleFrom="sm">
        <Carousel
          slideSize={{ base: "85%", sm: "45%", md: "32%", lg: "24%" }}
          slideGap="md"
          emblaOptions={{ align: "start" }}
          withControls
          controlSize={36}
          styles={{
            control: {
              background: "light-dark(rgba(255,255,255,0.95), rgba(26,27,30,0.95))",
              border: "1px solid light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.08))",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            },
          }}
        >
          {events.map((event) => (
            <Carousel.Slide key={event.id}>
              <EventCard event={event} variant="compact" />
            </Carousel.Slide>
          ))}
        </Carousel>
      </Box>
    </Stack>
  );
}
