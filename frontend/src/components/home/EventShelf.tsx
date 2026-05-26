import { Link } from "react-router-dom";
import { Anchor, Box, Group, Stack, Title } from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { IconChevronRight } from "@tabler/icons-react";
import { EventCard } from "../EventCard";
import type { Event } from "../../types/api";

interface EventShelfProps {
  title: string;
  events: Event[];
  viewAllHref?: string;
}

export function EventShelf({ title, events, viewAllHref }: EventShelfProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={2} size="h3">
          {title}
        </Title>
        {viewAllHref ? (
          <Anchor
            component={Link}
            to={viewAllHref}
            c="brand"
            fw={600}
            size="sm"
            underline="never"
            style={{ display: "flex", alignItems: "center", gap: 4 }}
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
