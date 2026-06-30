import { Alert, Badge, Box, Group, ScrollArea, Skeleton, Stack, Text, Title } from "@mantine/core";
import { IconBrandSpotify } from "@tabler/icons-react";
import type {
  SpotifyArtistRef,
  SpotifyRecommendedEvent,
} from "@/modules/integrations/api/spotifyService";
import { DiceEventCard } from "@/modules/catalog/features/browse/components/DiceEventCard";

interface EventsSpotifySectionProps {
  events: SpotifyRecommendedEvent[];
  topArtists?: SpotifyArtistRef[];
  loading: boolean;
}

function SpotifySectionSkeleton() {
  return (
    <ScrollArea type="scroll" offsetScrollbars className="events-spotify-scroll">
      <Group gap="md" wrap="nowrap" className="events-spotify-track">
        {Array.from({ length: 4 }).map((_, index) => (
          <Box key={index} className="events-spotify-card-slot">
            <Stack gap="sm">
              <Skeleton height={160} radius="md" className="skeleton-shimmer" />
              <Skeleton height={12} radius="sm" className="skeleton-shimmer" />
              <Skeleton height={10} width="60%" radius="sm" className="skeleton-shimmer" />
            </Stack>
          </Box>
        ))}
      </Group>
    </ScrollArea>
  );
}

export function EventsSpotifySection({
  events,
  topArtists = [],
  loading,
}: EventsSpotifySectionProps) {
  return (
    <Stack gap="md" className="events-spotify-section">
      <Group gap="sm" align="center" wrap="wrap">
        <IconBrandSpotify size={22} className="events-spotify-icon" />
        <Title order={2} className="events-page-heading">
          Para você{" "}
          <Text span inherit className="events-page-heading-muted">
            no Spotify
          </Text>
        </Title>
      </Group>

      {loading ? <SpotifySectionSkeleton /> : null}

      {!loading && events.length === 0 ? (
        <Alert color="gray" variant="light" title="Nenhuma sugestão por enquanto">
          <Stack gap="sm">
            <Text size="sm">
              Cruzamos seus artistas mais ouvidos com os eventos publicados, mas ainda não
              encontramos correspondência na vitrine.
            </Text>
            {topArtists.length > 0 ? (
              <Group gap={6} wrap="wrap">
                {topArtists.slice(0, 5).map((artist) => (
                  <Badge key={artist.id} size="sm" variant="outline" color="gray" radius="sm">
                    {artist.name}
                  </Badge>
                ))}
              </Group>
            ) : null}
          </Stack>
        </Alert>
      ) : null}

      {!loading && events.length > 0 ? (
        <ScrollArea type="scroll" offsetScrollbars className="events-spotify-scroll">
          <Group gap="md" wrap="nowrap" className="events-spotify-track">
            {events.map((event) => (
              <Box key={event.id} className="events-spotify-card-slot">
                <Stack gap={6}>
                  <DiceEventCard event={event} />
                  {event.matchedArtists.length > 0 ? (
                    <Group gap={6} wrap="wrap" className="events-spotify-matches">
                      {event.matchedArtists.slice(0, 2).map((artist) => (
                        <Badge key={artist.id} size="xs" variant="light" color="green" radius="sm">
                          {artist.name}
                        </Badge>
                      ))}
                    </Group>
                  ) : null}
                </Stack>
              </Box>
            ))}
          </Group>
        </ScrollArea>
      ) : null}
    </Stack>
  );
}
