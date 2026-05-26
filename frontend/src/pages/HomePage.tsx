import { useEffect, useState } from "react";
import {
  Alert,
  Center,
  Grid,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { EventCard } from "../components/EventCard";
import * as eventService from "../services/eventService";
import type { Event } from "../types/api";
import { getApiErrorMessage } from "../utils/errors";

export function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    eventService
      .listPublishedEvents()
      .then((data) => {
        if (!cancelled) {
          setEvents(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Não foi possível carregar os eventos."));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Center py="xl">
        <Loader color="brand" size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="xl">
      <Stack gap={4}>
        <Title order={1}>Descubra eventos</Title>
        <Text c="dimmed" size="lg">
          Explore eventos publicados e garanta sua vaga.
        </Text>
      </Stack>

      {error ? (
        <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro ao carregar">
          {error}
        </Alert>
      ) : null}

      {!error && events.length === 0 ? (
        <Alert icon={<IconAlertCircle size={18} />} color="gray" title="Nenhum evento disponível">
          Não há eventos publicados no momento. Volte em breve!
        </Alert>
      ) : null}

      {events.length > 0 ? (
        <Grid>
          {events.map((event) => (
            <Grid.Col key={event.id} span={{ base: 12, sm: 6, lg: 4 }}>
              <EventCard event={event} />
            </Grid.Col>
          ))}
        </Grid>
      ) : null}
    </Stack>
  );
}
