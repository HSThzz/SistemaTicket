/**
 * @file Dashboard do produtor com métricas agregadas e visão analítica.
 * @module pages/producer/ProducerDashboardPage
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
  Grid,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCalendarEvent,
  IconCash,
  IconLayoutDashboard,
  IconPlus,
  IconScan,
  IconTicket,
  IconTrendingUp,
} from "@tabler/icons-react";
import { EmptyState } from "@/components/account/EmptyState";
import { PageHeader } from "@/components/account/PageHeader";
import { PremiumPaper } from "@/components/account/PremiumPaper";
import { StatCard } from "@/components/account/StatCard";
import { ProducerDashboardAlerts } from "@/components/producer/ProducerDashboardAlerts";
import { ProducerDashboardPerformanceTable } from "@/components/producer/ProducerDashboardPerformanceTable";
import { ProducerNav } from "@/components/producer/ProducerNav";
import { ProducerPanelSkeleton } from "@/components/producer/ProducerPanelSkeleton";
import { ProducerTopPerformers } from "@/components/producer/ProducerTopPerformers";
import { EventTypeFilterControl } from "@/components/events/EventTypeFilterControl";
import * as eventService from "@/modules/catalog/api/eventService";
import type { ProducerDashboardStats } from "@/shared/types/api";
import { formatCurrencyFromCents } from "@/shared/utils/format";
import {
  computeProducerEventSummary,
  countEventsByTypeFilter,
  filterProducerStatsByType,
  type EventTypeFilter,
} from "@/modules/catalog/utils/eventTypeFilter";
import { getApiErrorMessage } from "@/shared/utils/errors";

const DASHBOARD_HEADER = (
  <PageHeader
    icon={<IconLayoutDashboard size={28} color="var(--mantine-color-brand-6)" />}
    title="Dashboard de"
    highlight="vendas"
    description="Receita, ocupação e check-ins em um só lugar."
  />
);

interface ContextMetricProps {
  label: string;
  value: string;
  tone?: "default" | "warning" | "success";
}

function ContextMetric({ label, value, tone = "default" }: ContextMetricProps) {
  return (
    <Stack gap={2} className={`producer-dashboard-context-metric is-${tone}`}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Text className="producer-dashboard-context-value">{value}</Text>
    </Stack>
  );
}

/**
 * Painel analítico do produtor — métricas, alertas e ranking de desempenho.
 */
export function ProducerDashboardPage() {
  const [stats, setStats] = useState<ProducerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<EventTypeFilter>("all");

  useEffect(() => {
    let cancelled = false;

    eventService
      .getProducerDashboardStats()
      .then((data) => {
        if (!cancelled) {
          setStats(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Falha ao carregar estatísticas."));
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

  const filteredEvents = useMemo(() => {
    if (!stats) {
      return [];
    }

    return filterProducerStatsByType(stats.events, typeFilter);
  }, [stats, typeFilter]);

  const typeCounts = useMemo(() => {
    if (!stats) {
      return { all: 0, public: 0, private: 0 };
    }

    return countEventsByTypeFilter(stats.events);
  }, [stats]);

  const filteredSummary = useMemo(
    () => computeProducerEventSummary(filteredEvents),
    [filteredEvents],
  );

  const derived = useMemo(() => {
    if (!stats) {
      return null;
    }

    const checkInRate =
      filteredSummary.ticketsSold > 0
        ? Math.round((filteredSummary.ticketsCheckedIn / filteredSummary.ticketsSold) * 100)
        : 0;

    const pendingCheckIns = filteredSummary.ticketsSold - filteredSummary.ticketsCheckedIn;
    const draftEvents = filteredSummary.draftEvents;
    const avgRevenuePerPublished =
      filteredSummary.publishedEvents > 0
        ? Math.round(filteredSummary.grossRevenueCents / filteredSummary.publishedEvents)
        : 0;

    return {
      checkInRate,
      pendingCheckIns,
      draftEvents,
      avgRevenuePerPublished,
    };
  }, [stats, filteredSummary]);

  if (loading) {
    return (
      <Stack gap="lg" className="producer-dashboard">
        {DASHBOARD_HEADER}
        <ProducerNav />
        <ProducerPanelSkeleton variant="dashboard" />
      </Stack>
    );
  }

  if (error || !stats || !derived) {
    return (
      <Stack gap="lg" className="producer-dashboard">
        {DASHBOARD_HEADER}
        <ProducerNav />
        <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro" radius="lg">
          {error ?? "Dados indisponíveis."}
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack gap="lg" className="producer-dashboard">
      {DASHBOARD_HEADER}
      <ProducerNav />

      <section className="producer-dashboard-kpis">
        <Group justify="flex-end" mb="sm">
          <EventTypeFilterControl
            value={typeFilter}
            onChange={setTypeFilter}
            counts={typeCounts}
          />
        </Group>

        <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="md">
          <StatCard
            label="Receita bruta"
            value={formatCurrencyFromCents(filteredSummary.grossRevenueCents)}
            icon={<IconCash size={20} />}
            iconColor="brand"
          />
          <StatCard
            label="Ingressos vendidos"
            value={String(filteredSummary.ticketsSold)}
            icon={<IconTicket size={20} />}
            iconColor="teal"
            valueColor="teal"
          />
          <StatCard
            label="Check-ins"
            value={String(filteredSummary.ticketsCheckedIn)}
            icon={<IconScan size={20} />}
            iconColor="blue"
            valueColor="blue"
          />
          <StatCard
            label="Taxa de presença"
            value={`${derived.checkInRate}%`}
            icon={<IconTrendingUp size={20} />}
            iconColor="grape"
            valueColor="grape"
          />
        </SimpleGrid>

        <PremiumPaper p="md" className="producer-dashboard-context">
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <ContextMetric
              label="Eventos"
              value={String(filteredSummary.totalEvents)}
            />
            <ContextMetric
              label="Publicados"
              value={String(filteredSummary.publishedEvents)}
              tone="success"
            />
            <ContextMetric
              label="Pendentes na entrada"
              value={String(derived.pendingCheckIns)}
              tone={derived.pendingCheckIns > 0 ? "warning" : "default"}
            />
            <ContextMetric
              label="Receita média"
              value={formatCurrencyFromCents(derived.avgRevenuePerPublished)}
            />
          </SimpleGrid>
        </PremiumPaper>
      </section>

      {stats.events.length === 0 ? (
        <PremiumPaper p="xl">
          <EmptyState
            icon={<IconPlus size={32} />}
            title="Nenhum evento cadastrado"
            description="Crie seu primeiro evento para começar a acompanhar vendas e check-ins aqui."
            action={
              <Button
                component={Link}
                to="/produtor/eventos/novo"
                radius="xl"
                leftSection={<IconPlus size={18} />}
              >
                Criar evento
              </Button>
            }
          />
        </PremiumPaper>
      ) : filteredEvents.length === 0 ? (
        <PremiumPaper p="xl">
          <Stack gap="md" align="center">
            <Text ta="center" c="dimmed" size="sm">
              Nenhum evento {typeFilter === "private" ? "privado" : "público"} cadastrado.
            </Text>
            <EventTypeFilterControl
              value={typeFilter}
              onChange={setTypeFilter}
              counts={typeCounts}
            />
          </Stack>
        </PremiumPaper>
      ) : (
        <>
          <ProducerDashboardAlerts events={filteredEvents} />

          <Grid gap="lg" className="producer-dashboard-layout">
            <Grid.Col span={{ base: 12, lg: 8 }} className="producer-dashboard-main">
              <PremiumPaper p="lg" className="producer-dashboard-table-panel">
                <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm" mb="md">
                  <Stack gap={4}>
                    <Title order={3} size="h4">
                      Desempenho por evento
                    </Title>
                    <Text c="dimmed" size="sm">
                      Vendas, check-in e ocupação consolidados.
                    </Text>
                  </Stack>
                  <Badge size="lg" variant="light" color="brand" radius="sm">
                    {filteredEvents.length} evento{filteredEvents.length === 1 ? "" : "s"}
                  </Badge>
                </Group>
                <ProducerDashboardPerformanceTable events={filteredEvents} />
              </PremiumPaper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, lg: 4 }} className="producer-dashboard-side">
              <Stack gap="md">
                <PremiumPaper p="lg" className="producer-dashboard-side-card">
                  <Stack gap="md">
                    <Stack gap={4}>
                      <Title order={4} size="h5">
                        Melhores desempenhos
                      </Title>
                      <Text c="dimmed" size="sm">
                        Maior receita até agora.
                      </Text>
                    </Stack>
                    <ProducerTopPerformers events={filteredEvents} />
                  </Stack>
                </PremiumPaper>

                <PremiumPaper p="md" className="producer-dashboard-actions">
                  <Stack gap="sm">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Ações rápidas
                    </Text>
                    <Button
                      component={Link}
                      to="/produtor/check-in"
                      variant="light"
                      radius="xl"
                      leftSection={<IconScan size={18} />}
                      fullWidth
                    >
                      Abrir check-in
                    </Button>
                    <Button
                      component={Link}
                      to="/produtor/eventos"
                      variant="default"
                      radius="xl"
                      leftSection={<IconCalendarEvent size={18} />}
                      fullWidth
                    >
                      Gerenciar eventos
                    </Button>
                    {derived.draftEvents > 0 ? (
                      <Button
                        component={Link}
                        to="/produtor/eventos"
                        variant="subtle"
                        color="yellow"
                        radius="xl"
                        fullWidth
                      >
                        {derived.draftEvents} rascunho
                        {derived.draftEvents === 1 ? "" : "s"} para publicar
                      </Button>
                    ) : null}
                  </Stack>
                </PremiumPaper>
              </Stack>
            </Grid.Col>
          </Grid>
        </>
      )}
    </Stack>
  );
}
