/**
 * @file Dashboard do produtor com métricas agregadas e eventos em destaque.
 * @module pages/producer/ProducerDashboardPage
 */

import { useEffect, useState } from "react";
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
  IconCash,
  IconLayoutDashboard,
  IconPlus,
  IconScan,
  IconTicket,
  IconTrendingUp,
} from "@tabler/icons-react";
import { EmptyState } from "../../components/account/EmptyState";
import { PageHeader } from "../../components/account/PageHeader";
import { PremiumPaper } from "../../components/account/PremiumPaper";
import { StatCard } from "../../components/account/StatCard";
import { ProducerEventStatsCard } from "../../components/producer/ProducerEventStatsCard";
import { ProducerMobileActions } from "../../components/producer/ProducerMobileActions";
import { ProducerPanelSkeleton } from "../../components/producer/ProducerPanelSkeleton";
import * as eventService from "../../features/catalog/api/eventService";
import type { ProducerDashboardStats } from "../../types/api";
import { formatCurrencyFromCents } from "../../utils/format";
import { getApiErrorMessage } from "../../utils/errors";

const DASHBOARD_HEADER = (
  <PageHeader
    icon={<IconLayoutDashboard size={28} color="var(--mantine-color-brand-6)" />}
    title="Dashboard de"
    highlight="vendas"
    description="Visão geral dos seus eventos, receita e check-ins em tempo real."
    action={
      <Group gap="sm" visibleFrom="sm">
        <Button component={Link} to="/produtor/eventos" variant="light" radius="xl">
          Meus eventos
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
);

/**
 * Painel inicial do produtor: receita, ingressos vendidos/check-in e cards por evento.
 */
export function ProducerDashboardPage() {
  const [stats, setStats] = useState<ProducerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <Stack gap="lg">
        {DASHBOARD_HEADER}
        <ProducerMobileActions variant="dashboard" />
        <ProducerPanelSkeleton />
      </Stack>
    );
  }

  if (error || !stats) {
    return (
      <Stack gap="lg">
        {DASHBOARD_HEADER}
        <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro" radius="lg">
          {error ?? "Dados indisponíveis."}
        </Alert>
      </Stack>
    );
  }

  const checkInRate =
    stats.summary.ticketsSold > 0
      ? Math.round((stats.summary.ticketsCheckedIn / stats.summary.ticketsSold) * 100)
      : 0;

  return (
    <Stack gap="lg">
      {DASHBOARD_HEADER}

      <ProducerMobileActions variant="dashboard" />

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <StatCard
          label="Receita bruta"
          value={formatCurrencyFromCents(stats.summary.grossRevenueCents)}
          icon={<IconCash size={20} />}
          iconColor="brand"
        />
        <StatCard
          label="Ingressos vendidos"
          value={String(stats.summary.ticketsSold)}
          icon={<IconTicket size={20} />}
          iconColor="teal"
          valueColor="teal"
        />
        <StatCard
          label="Check-ins"
          value={String(stats.summary.ticketsCheckedIn)}
          icon={<IconScan size={20} />}
          iconColor="blue"
          valueColor="blue"
        />
        <StatCard
          label="Taxa de presença"
          value={`${checkInRate}%`}
          icon={<IconTrendingUp size={20} />}
          iconColor="grape"
          valueColor="grape"
        />
      </SimpleGrid>

      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Stack gap={4}>
            <Title order={3} size="h4">
              Desempenho por evento
            </Title>
            <Text c="dimmed" size="sm">
              Clique em um evento para abrir o painel de gestão.
            </Text>
          </Stack>
          {stats.events.length > 0 ? (
            <Badge size="lg" variant="light" color="brand" radius="sm">
              {stats.events.length} evento{stats.events.length === 1 ? "" : "s"}
            </Badge>
          ) : null}
        </Group>

        {stats.events.length === 0 ? (
          <PremiumPaper p="xl">
            <EmptyState
              icon={<IconPlus size={32} />}
              title="Nenhum evento cadastrado"
              description="Crie seu primeiro evento para começar a vender ingressos."
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
        ) : (
          <Stack gap="md">
            {stats.events.map((event) => (
              <ProducerEventStatsCard key={event.eventId} event={event} />
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
