import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Anchor,
  Button,
  Center,
  Grid,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconTicket } from "@tabler/icons-react";
import { TicketCard } from "../components/TicketCard";
import * as ticketService from "../services/ticketService";
import type { TicketListItem } from "../types/api";
import { getApiErrorMessage } from "../utils/errors";

export function MyTicketsPage() {
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    ticketService
      .listMyTickets()
      .then((data) => {
        if (!cancelled) {
          setTickets(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Não foi possível carregar seus ingressos."));
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

  const activeTickets = tickets.filter((ticket) => ticket.status === "ACTIVE");

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Title order={1}>Meus ingressos</Title>
          <Text c="dimmed">
            {activeTickets.length > 0
              ? `${activeTickets.length} ingresso${activeTickets.length === 1 ? "" : "s"} ativo${activeTickets.length === 1 ? "" : "s"}`
              : "Nenhum ingresso ativo no momento"}
          </Text>
        </Stack>
        <Button component={Link} to="/" variant="light" leftSection={<IconTicket size={18} />}>
          Explorar eventos
        </Button>
      </Group>

      {error ? (
        <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro">
          {error}
        </Alert>
      ) : null}

      {!error && tickets.length === 0 ? (
        <Alert icon={<IconAlertCircle size={18} />} color="gray" title="Nenhum ingresso">
          Você ainda não possui ingressos.{" "}
          <Anchor component={Link} to="/">
            Ver eventos disponíveis
          </Anchor>
        </Alert>
      ) : null}

      {tickets.length > 0 ? (
        <Grid>
          {tickets.map((ticket) => (
            <Grid.Col key={ticket.id} span={{ base: 12, md: 6 }}>
              <TicketCard ticket={ticket} />
            </Grid.Col>
          ))}
        </Grid>
      ) : null}
    </Stack>
  );
}
