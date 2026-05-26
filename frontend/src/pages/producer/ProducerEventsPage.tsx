import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
  Group,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { IconAlertCircle, IconCalendarEvent, IconChartBar, IconPlus, IconScan } from "@tabler/icons-react";
import { AnimatedSection } from "../../components/home/AnimatedSection";
import { EmptyState } from "../../components/account/EmptyState";
import { PageHeader } from "../../components/account/PageHeader";
import { PageLoader } from "../../components/account/PageLoader";
import { PremiumPaper } from "../../components/account/PremiumPaper";
import * as eventService from "../../services/eventService";
import type { Event } from "../../types/api";
import { formatShortDate } from "../../utils/format";
import { getApiErrorMessage } from "../../utils/errors";
import { getEventStatusColor, getEventStatusLabel } from "../../utils/statusLabels";

export function ProducerEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    eventService
      .listManagedEvents()
      .then((data) => {
        if (!cancelled) {
          setEvents(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Não foi possível carregar seus eventos."));
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
    return <PageLoader label="Carregando eventos..." />;
  }

  return (
    <Stack gap="lg">
      <AnimatedSection>
        <PageHeader
          icon={<IconCalendarEvent size={28} color="var(--mantine-color-brand-6)" />}
          title="Meus"
          highlight="eventos"
          description="Crie, publique e gerencie lotes de ingressos para cada experiência."
          action={
            <Group gap="sm" visibleFrom="xs">
              <Button
                component={Link}
                to="/produtor"
                variant="subtle"
                radius="xl"
                leftSection={<IconChartBar size={18} />}
              >
                Dashboard
              </Button>
              <Button
                component={Link}
                to="/produtor/check-in"
                variant="light"
                radius="xl"
                leftSection={<IconScan size={18} />}
              >
                Check-in
              </Button>
              <Button
                component={Link}
                to="/produtor/eventos/novo"
                radius="xl"
                leftSection={<IconPlus size={18} />}
              >
                Novo evento
              </Button>
            </Group>
          }
        />
      </AnimatedSection>

      {error ? (
        <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro" radius="lg">
          {error}
        </Alert>
      ) : null}

      {!error && events.length === 0 ? (
        <AnimatedSection delayMs={60}>
          <EmptyState
            icon={<IconPlus size={32} />}
            title="Nenhum evento criado"
            description="Comece criando seu primeiro evento como rascunho e adicione os lotes de ingressos."
            action={
              <Button
                component={Link}
                to="/produtor/eventos/novo"
                radius="xl"
                leftSection={<IconPlus size={18} />}
              >
                Criar primeiro evento
              </Button>
            }
          />
        </AnimatedSection>
      ) : null}

      {events.length > 0 ? (
        <AnimatedSection delayMs={80}>
          <PremiumPaper className="data-table-panel">
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Evento</Table.Th>
                  <Table.Th>Data</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Lotes</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {events.map((event) => (
                  <Table.Tr key={event.id}>
                    <Table.Td>
                      <Stack gap={2}>
                        <Text fw={600}>{event.title}</Text>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {event.location}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>{formatShortDate(event.date)}</Table.Td>
                    <Table.Td>
                      <Badge color={getEventStatusColor(event.status)} variant="light" radius="sm">
                        {getEventStatusLabel(event.status)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{event.ticketLots.length}</Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        variant="light"
                        radius="xl"
                        component={Link}
                        to={`/produtor/eventos/${event.id}`}
                      >
                        Gerenciar
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </PremiumPaper>
        </AnimatedSection>
      ) : null}
    </Stack>
  );
}
