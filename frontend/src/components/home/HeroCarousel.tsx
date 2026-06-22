import { Link } from "react-router-dom";
import { Carousel } from "@mantine/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import { Box, Button, Group, Stack, Text, Title } from "@mantine/core";
import { IconCalendar, IconMapPin, IconTicket } from "@tabler/icons-react";
import type { Event } from "../../types/api";
import {
  extractCity,
  getEventCoverStyle,
  getEventGradient,
} from "../../utils/eventVisuals";
import { formatShortDate } from "../../utils/format";

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
    <Box className="hero-carousel">
      <Carousel
        withIndicators
        height={400}
        slideSize="100%"
        slideGap={0}
        emblaOptions={{ loop: slides.length > 1, align: "center" }}
        plugins={[autoplay.current]}
        classNames={{
          viewport: "hero-carousel-viewport",
          slide: "hero-carousel-slide",
        }}
        styles={{
          indicator: {
            width: 8,
            height: 8,
            transition: "width 250ms ease, background-color 250ms ease",
          },
          control: {
            background: "light-dark(rgba(255,255,255,0.92), rgba(139, 139, 139, 0.92))",
            border: "none",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          },
        }}
      >
        {slides.map((event, index) => {
          const [glowColor] = getEventGradient(event.id);

          return (
            <Carousel.Slide key={event.id}>
              <Box
                component={Link}
                to={`/eventos/${event.id}`}
                className="hero-slide"
                style={{
                  ...getEventCoverStyle(event),
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
