import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
  Grid,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCalendarEvent,
  IconCircleCheck,
  IconSearch,
  IconTicket,
} from "@tabler/icons-react";
import { AnimatedSection } from "../components/home/AnimatedSection";
import { EmptyState } from "../components/account/EmptyState";
import { PageHeader } from "../components/account/PageHeader";
import { TicketsPageSkeleton } from "../components/account/TicketsPageSkeleton";
import { TicketCard } from "../components/TicketCard";
import * as ticketService from "../services/ticketService";
import type { TicketListItem } from "../types/api";
import { getApiErrorMessage } from "../utils/errors";

type TicketFilter = "all" | "ACTIVE" | "USED" | "CANCELLED";

const FILTER_OPTIONS: { label: string; value: TicketFilter }[] = [
  { label: "Todos", value: "all" },
  { label: "Ativos", value: "ACTIVE" },
  { label: "Utilizados", value: "USED" },
  { label: "Cancelados", value: "CANCELLED" },
];

function countByStatus(tickets: TicketListItem[], status: string) {
  return tickets.filter((ticket) => ticket.status === status).length;
}

export function MyTicketsPage() {
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TicketFilter>("all");

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

  const filteredTickets = useMemo(() => {
    if (filter === "all") {
      return tickets;
    }
    return tickets.filter((ticket) => ticket.status === filter);
  }, [tickets, filter]);

  const stats = useMemo(
    () => ({
      total: tickets.length,
      active: countByStatus(tickets, "ACTIVE"),
      used: countByStatus(tickets, "USED"),
    }),
    [tickets],
  );

  if (loading) {
    return <TicketsPageSkeleton />;
  }

  return (
    <Stack gap="lg">
      <AnimatedSection>
        <PageHeader
          icon={<IconTicket size={28} color="var(--mantine-color-brand-6)" />}
          title="Meus"
          highlight="ingressos"
          description="Seus ingressos digitais com QR Code para entrada. Filtre por status e acesse os detalhes de cada evento."
          action={
            <Button
              component={Link}
              to="/"
              variant="light"
              radius="xl"
              leftSection={<IconSearch size={18} />}
              visibleFrom="xs"
            >
              Explorar eventos
            </Button>
          }
        />
      </AnimatedSection>

      {error ? (
        <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro ao carregar" radius="lg">
          {error}
        </Alert>
      ) : null}

      {!error && tickets.length > 0 ? (
        <>
          <AnimatedSection delayMs={60}>
            <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="md">
              <Paper radius="lg" p="md" className="stat-card">
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon size={40} radius="md" variant="light" color="brand">
                    <IconTicket size={20} />
                  </ThemeIcon>
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Total
                    </Text>
                    <Text className="stat-card-value">{stats.total}</Text>
                  </Stack>
                </Group>
              </Paper>
              <Paper radius="lg" p="md" className="stat-card">
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon size={40} radius="md" variant="light" color="green">
                    <IconCalendarEvent size={20} />
                  </ThemeIcon>
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Ativos
                    </Text>
                    <Text className="stat-card-value" c="green">
                      {stats.active}
                    </Text>
                  </Stack>
                </Group>
              </Paper>
              <Paper radius="lg" p="md" className="stat-card">
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon size={40} radius="md" variant="light" color="blue">
                    <IconCircleCheck size={20} />
                  </ThemeIcon>
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Utilizados
                    </Text>
                    <Text className="stat-card-value" c="blue">
                      {stats.used}
                    </Text>
                  </Stack>
                </Group>
              </Paper>
            </SimpleGrid>
          </AnimatedSection>

          <AnimatedSection delayMs={100}>
            <SegmentedControl
              className="filter-pills"
              value={filter}
              onChange={(value) => setFilter(value as TicketFilter)}
              data={FILTER_OPTIONS}
              radius="xl"
              fullWidth
              size="sm"
            />
          </AnimatedSection>

          {filteredTickets.length === 0 ? (
            <AnimatedSection delayMs={120}>
              <EmptyState
                icon={<IconTicket size={32} />}
                title="Nenhum ingresso neste filtro"
                description="Tente outro status ou explore novos eventos para comprar ingressos."
                action={
                  <Button component={Link} to="/" variant="light" radius="xl">
                    Ver eventos
                  </Button>
                }
              />
            </AnimatedSection>
          ) : (
            <Grid>
              {filteredTickets.map((ticket, index) => (
                <Grid.Col key={ticket.id} span={{ base: 12, lg: 6 }}>
                  <AnimatedSection delayMs={120 + index * 40}>
                    <TicketCard ticket={ticket} />
                  </AnimatedSection>
                </Grid.Col>
              ))}
            </Grid>
          )}
        </>
      ) : null}

      {!error && tickets.length === 0 ? (
        <AnimatedSection delayMs={60}>
          <EmptyState
            icon={<IconTicket size={32} />}
            title="Nenhum ingresso ainda"
            description="Quando você comprar um ingresso com PIX, ele aparecerá aqui com QR Code para o check-in no evento."
            action={
              <Button
                component={Link}
                to="/"
                radius="xl"
                leftSection={<IconSearch size={18} />}
              >
                Descobrir eventos
              </Button>
            }
          />
        </AnimatedSection>
      ) : null}

      {!error && tickets.length > 0 ? (
        <Button
          component={Link}
          to="/"
          variant="subtle"
          radius="xl"
          leftSection={<IconSearch size={18} />}
          hiddenFrom="xs"
          fullWidth
        >
          Explorar eventos
        </Button>
      ) : null}
    </Stack>
  );
}
