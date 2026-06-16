/**
 * @file Listagem de eventos gerenciados pelo produtor.
 * @module pages/producer/ProducerEventsPage
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCalendarEvent,
  IconPlus,
  IconTicket,
} from "@tabler/icons-react";
import { EmptyState } from "../../components/account/EmptyState";
import { PageHeader } from "../../components/account/PageHeader";
import { PremiumPaper } from "../../components/account/PremiumPaper";
import { StatCard } from "../../components/account/StatCard";
import { ProducerEventListCard } from "../../components/producer/ProducerEventListCard";
import { ProducerNav } from "../../components/producer/ProducerNav";
import { ProducerPanelSkeleton } from "../../components/producer/ProducerPanelSkeleton";
import * as eventService from "../../features/catalog/api/eventService";
import type { Event } from "../../types/api";
import { getEventDeleteConfirmationCopy } from "../../utils/eventStatus";
import { getApiErrorMessage } from "../../utils/errors";

type EventFilter = "all" | "published" | "draft";

const EVENTS_HEADER = (
  <PageHeader
    icon={<IconCalendarEvent size={28} color="var(--mantine-color-brand-6)" />}
    title="Meus"
    highlight="eventos"
    description="Lista completa dos seus eventos — edite informações, publique e configure lotes."
  />
);

/**
 * Catálogo de eventos do produtor com foco em gestão operacional.
 */
export function ProducerEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<EventFilter>("all");
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadEvents = useCallback(() => {
    setLoading(true);
    setError(null);

    return eventService
      .listManagedEvents()
      .then((data) => {
        setEvents(data);
      })
      .catch((err) => {
        setError(getApiErrorMessage(err, "Não foi possível carregar seus eventos."));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const deleteConfirmation = eventToDelete
    ? getEventDeleteConfirmationCopy(eventToDelete.status)
    : null;

  const handleConfirmDelete = async () => {
    if (!eventToDelete) {
      return;
    }

    setDeleting(true);

    try {
      await eventService.deleteManagedEvent(eventToDelete.id);
      setEvents((current) => current.filter((event) => event.id !== eventToDelete.id));
      setEventToDelete(null);

      notifications.show({
        title: "Evento removido",
        message: "O evento saiu da sua lista. Histórico de vendas e ingressos foi preservado.",
        color: "green",
      });
    } catch (err) {
      notifications.show({
        title: "Não foi possível remover",
        message: getApiErrorMessage(err, "Tente novamente em instantes."),
        color: "red",
      });
    } finally {
      setDeleting(false);
    }
  };

  const summary = useMemo(() => {
    const published = events.filter((event) => event.status === "PUBLISHED").length;
    const drafts = events.filter((event) => event.status === "DRAFT").length;
    const lots = events.reduce((sum, event) => sum + event.ticketLots.length, 0);

    return {
      total: events.length,
      published,
      drafts,
      lots,
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    if (filter === "published") {
      return sorted.filter((event) => event.status === "PUBLISHED");
    }

    if (filter === "draft") {
      return sorted.filter((event) => event.status === "DRAFT");
    }

    return sorted;
  }, [events, filter]);

  if (loading) {
    return (
      <Stack gap="lg">
        {EVENTS_HEADER}
        <ProducerNav />
        <ProducerPanelSkeleton variant="events" />
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      {EVENTS_HEADER}

      <ProducerNav />

      <Modal
        opened={Boolean(eventToDelete)}
        onClose={() => {
          if (!deleting) {
            setEventToDelete(null);
          }
        }}
        title={deleteConfirmation?.title ?? "Remover evento?"}
        centered
      >
        <Stack gap="md">
          <Text size="sm">{deleteConfirmation?.message}</Text>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={() => setEventToDelete(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              color={deleteConfirmation?.color ?? "red"}
              onClick={() => void handleConfirmDelete()}
              loading={deleting}
            >
              {deleteConfirmation?.confirmLabel ?? "Remover"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {error ? (
        <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro" radius="lg">
          {error}
        </Alert>
      ) : null}

      {!error && events.length > 0 ? (
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
          <StatCard
            label="Total"
            value={String(summary.total)}
            icon={<IconCalendarEvent size={20} />}
          />
          <StatCard
            label="Publicados"
            value={String(summary.published)}
            icon={<IconTicket size={20} />}
            iconColor="teal"
            valueColor="teal"
          />
          <StatCard
            label="Rascunhos"
            value={String(summary.drafts)}
            icon={<IconTicket size={20} />}
            iconColor="gray"
            valueColor="dimmed"
          />
          <StatCard
            label="Lotes"
            value={String(summary.lots)}
            icon={<IconTicket size={20} />}
            iconColor="brand"
          />
        </SimpleGrid>
      ) : null}

      {!error && events.length === 0 ? (
        <PremiumPaper p="xl">
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
        </PremiumPaper>
      ) : null}

      {events.length > 0 ? (
        <Stack gap="md">
          <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
            <Stack gap={4}>
              <Title order={3} size="h4">
                Catálogo de eventos
              </Title>
              <Text c="dimmed" size="sm">
                Selecione um evento para editar detalhes, publicar ou gerenciar lotes.
              </Text>
            </Stack>

            <SegmentedControl
              value={filter}
              onChange={(value) => setFilter(value as EventFilter)}
              data={[
                { label: `Todos (${summary.total})`, value: "all" },
                { label: `Publicados (${summary.published})`, value: "published" },
                { label: `Rascunhos (${summary.drafts})`, value: "draft" },
              ]}
              radius="xl"
              className="producer-events-filter"
            />
          </Group>

          {filteredEvents.length === 0 ? (
            <PremiumPaper p="lg">
              <Text ta="center" c="dimmed" size="sm">
                Nenhum evento neste filtro.
              </Text>
            </PremiumPaper>
          ) : (
            <Stack gap="sm" className="producer-event-list">
              {filteredEvents.map((event) => (
                <ProducerEventListCard
                  key={event.id}
                  event={event}
                  onDelete={setEventToDelete}
                  deleting={deleting && eventToDelete?.id === event.id}
                />
              ))}
            </Stack>
          )}

          <Group justify="space-between" align="center">
            <Text size="sm" c="dimmed">
              {filteredEvents.length} de {events.length} evento
              {events.length === 1 ? "" : "s"}
            </Text>
            <Badge size="lg" variant="light" color="brand" radius="sm">
              {summary.lots} lote{summary.lots === 1 ? "" : "s"} no total
            </Badge>
          </Group>
        </Stack>
      ) : null}
    </Stack>
  );
}
