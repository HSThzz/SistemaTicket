import { Link } from "react-router-dom";
import { Carousel } from "@mantine/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import { Badge, Box, Button, Group, Stack, Text, Title } from "@mantine/core";
import { IconCalendar, IconMapPin, IconTicket } from "@tabler/icons-react";
import type { Event } from "../../types/api";
import {
  extractCity,
  getEventCoverStyle,
  getEventGradient,
  getLowestPrice,
  getTotalAvailable,
} from "../../utils/eventVisuals";
import { formatCurrencyFromCents, formatShortDate } from "../../utils/format";

interface HeroCarouselProps {
  events: Event[];
}

export function HeroCarousel({ events }: HeroCarouselProps) {
  const autoplay = useRef(Autoplay({ delay: 5500, stopOnInteraction: false }));

  if (events.length === 0) {
    return null;
  }

  const slides = events.slice(0, 5);

  return (
    <Box>
      <Carousel
        withIndicators
        height={380}
        slideSize="100%"
        slideGap="md"
        emblaOptions={{ loop: slides.length > 1, align: "center" }}
        plugins={[autoplay.current]}
        styles={{
          indicator: {
            width: 8,
            height: 8,
            transition: "width 250ms ease, background-color 250ms ease",
          },
          control: {
            background: "light-dark(rgba(255,255,255,0.92), rgba(26,27,30,0.92))",
            border: "none",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          },
        }}
      >
        {slides.map((event, index) => {
          const lowestPrice = getLowestPrice(event);
          const available = getTotalAvailable(event);
          const [glowColor] = getEventGradient(event.id);

          return (
            <Carousel.Slide key={event.id}>
              <Box
                component={Link}
                to={`/eventos/${event.id}`}
                className="hero-slide"
                style={{
                  ...getEventCoverStyle(event.id),
                  display: "block",
                  textDecoration: "none",
                  color: "white",
                  height: "100%",
                }}
              >
                <Box
                  className="hero-glow"
                  style={{
                    top: "10%",
                    right: "8%",
                    background: glowColor,
                    animationDelay: `${index * 1.2}s`,
                  }}
                />

                <Stack
                  justify="flex-end"
                  h="100%"
                  p={{ base: "lg", sm: "xl" }}
                  gap="md"
                  style={{ position: "relative", zIndex: 2 }}
                >
                  <Group gap="xs">
                    {available <= 20 && available > 0 ? (
                      <Badge color="orange" variant="filled" radius="sm">
                        Últimos ingressos
                      </Badge>
                    ) : null}
                    {lowestPrice !== null ? (
                      <Badge color="white" c="dark" variant="filled" radius="sm">
                        a partir de {formatCurrencyFromCents(lowestPrice)}
                      </Badge>
                    ) : null}
                  </Group>

                  <Title order={1} size="h2" maw={640} style={{ lineHeight: 1.15 }}>
                    {event.title}
                  </Title>

                  <Group gap="lg">
                    <Group gap={6}>
                      <IconMapPin size={18} />
                      <Text size="sm" fw={500}>
                        {extractCity(event.location)}
                      </Text>
                    </Group>
                    <Group gap={6}>
                      <IconCalendar size={18} />
                      <Text size="sm" fw={500}>
                        {formatShortDate(event.date)}
                      </Text>
                    </Group>
                  </Group>

                  <Group>
                    <Button
                      leftSection={<IconTicket size={18} />}
                      variant="white"
                      color="dark"
                      radius="xl"
                      size="md"
                    >
                      Ver ingressos
                    </Button>
                  </Group>
                </Stack>
              </Box>
            </Carousel.Slide>
          );
        })}
      </Carousel>
    </Box>
  );
}
