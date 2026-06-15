/**
 * @file Listagem de eventos gerenciados pelo produtor.
 * @module pages/producer/ProducerEventsPage
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCalendarEvent,
  IconChartBar,
  IconPlus,
  IconScan,
  IconTicket,
} from "@tabler/icons-react";
import { AnimatedSection } from "../../components/home/AnimatedSection";
import { EmptyState } from "../../components/account/EmptyState";
import { PageHeader } from "../../components/account/PageHeader";
import { PageLoader } from "../../components/account/PageLoader";
import { PremiumPaper } from "../../components/account/PremiumPaper";
import { StatCard } from "../../components/account/StatCard";
import { ProducerEventListCard } from "../../components/producer/ProducerEventListCard";
import { ProducerMobileActions } from "../../components/producer/ProducerMobileActions";
import * as eventService from "../../features/catalog/api/eventService";
import type { Event } from "../../types/api";
import { getApiErrorMessage } from "../../utils/errors";

/**
 * Lista todos os eventos do produtor com atalhos para criar, gerenciar e check-in.
 */
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
            <Group gap="sm" visibleFrom="sm">
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

      <ProducerMobileActions variant="events" />

      {error ? (
        <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro" radius="lg">
          {error}
        </Alert>
      ) : null}

      {!error && events.length > 0 ? (
        <AnimatedSection delayMs={60}>
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
        </AnimatedSection>
      ) : null}

      {!error && events.length === 0 ? (
        <AnimatedSection delayMs={60}>
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
        </AnimatedSection>
      ) : null}

      {events.length > 0 ? (
        <AnimatedSection delayMs={100}>
          <Stack gap="md">
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              <Stack gap={4}>
                <Title order={3} size="h4">
                  Todos os eventos
                </Title>
                <Text c="dimmed" size="sm">
                  Clique em um evento para editar, publicar ou gerenciar lotes.
                </Text>
              </Stack>
              <Badge size="lg" variant="light" color="brand" radius="sm">
                {events.length} evento{events.length === 1 ? "" : "s"}
              </Badge>
            </Group>

            <Stack gap="md">
              {events.map((event, index) => (
                <AnimatedSection key={event.id} delayMs={120 + index * 50}>
                  <ProducerEventListCard event={event} />
                </AnimatedSection>
              ))}
            </Stack>
          </Stack>
        </AnimatedSection>
      ) : null}
    </Stack>
  );
}
