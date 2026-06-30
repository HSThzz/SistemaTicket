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
import { EmptyState } from "@/shared/components/EmptyState";
import { PageHeader } from "@/shared/components/PageHeader";
import { PremiumPaper } from "@/shared/components/PremiumPaper";
import { StatCard } from "@/shared/components/StatCard";
import { ProducerEventListCard } from "@/modules/catalog/features/producer/components/ProducerEventListCard";
import { ProducerEventsFilterPanel } from "@/modules/catalog/features/producer/components/ProducerEventsFilterPanel";
import { ProducerNav } from "@/modules/catalog/features/producer/components/ProducerNav";
import { ProducerPanelSkeleton } from "@/modules/catalog/features/producer/components/ProducerPanelSkeleton";
import * as eventService from "@/modules/catalog/api/eventService";
import type { Event } from "@/shared/types/api";
import { getEventDeleteConfirmationCopy, toEventStatus } from "@/modules/catalog/features/producer/utils/eventStatus";
import {
  countEventsByTypeFilter,
  filterEventsByType,
  type EventTypeFilter,
} from "@/modules/catalog/utils/eventTypeFilter";
import { getApiErrorMessage } from "@/shared/utils/errors";

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
  const [typeFilter, setTypeFilter] = useState<EventTypeFilter>("all");
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
    ? getEventDeleteConfirmationCopy(toEventStatus(eventToDelete.status))
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

  const eventsForStatusCounts = useMemo(
    () => filterEventsByType(events, typeFilter),
    [events, typeFilter],
  );

  const summary = useMemo(() => {
    const published = eventsForStatusCounts.filter((event) => event.status === "PUBLISHED").length;
    const drafts = eventsForStatusCounts.filter((event) => event.status === "DRAFT").length;
    const lots = eventsForStatusCounts.reduce((sum, event) => sum + event.ticketLots.length, 0);

    return {
      total: eventsForStatusCounts.length,
      published,
      drafts,
      lots,
    };
  }, [eventsForStatusCounts]);

  const typeCounts = useMemo(() => {
    const eventsForTypeCounts =
      filter === "published"
        ? events.filter((event) => event.status === "PUBLISHED")
        : filter === "draft"
          ? events.filter((event) => event.status === "DRAFT")
          : events;

    return countEventsByTypeFilter(eventsForTypeCounts);
  }, [events, filter]);

  const statusCounts = useMemo(
    (): Record<"all" | "published" | "draft", number> => ({
      all: summary.total,
      published: summary.published,
      draft: summary.drafts,
    }),
    [summary],
  );

  const filteredEvents = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    let result = sorted;

    if (filter === "published") {
      result = result.filter((event) => event.status === "PUBLISHED");
    } else if (filter === "draft") {
      result = result.filter((event) => event.status === "DRAFT");
    }

    return filterEventsByType(result, typeFilter);
  }, [events, filter, typeFilter]);

  const hasActiveFilters = filter !== "all" || typeFilter !== "all";

  const handleClearFilters = () => {
    setFilter("all");
    setTypeFilter("all");
  };

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
          <Stack gap={4}>
            <Title order={3} size="h4">
              Catálogo de eventos
            </Title>
            <Text c="dimmed" size="sm">
              Selecione um evento para editar detalhes, publicar ou gerenciar lotes.
            </Text>
          </Stack>

          <ProducerEventsFilterPanel
            statusFilter={filter}
            onStatusFilterChange={setFilter}
            statusCounts={statusCounts}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            typeCounts={typeCounts}
            showClearFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />

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
              {hasActiveFilters ? " com os filtros atuais" : ""}
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
