/**
 * @file Página “Meus ingressos” com carteira digital e filtros por status.
 * @module pages/MyTicketsPage
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
  SegmentedControl,
  SimpleGrid,
  Stack,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCalendarEvent,
  IconCircleCheck,
  IconSearch,
  IconTicket,
} from "@tabler/icons-react";
import { AnimatedSection } from "@/shared/components/AnimatedSection";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatCard } from "@/shared/components/StatCard";
import { TicketsPageSkeleton } from "@/modules/ticketing/features/wallet/components/TicketsPageSkeleton";
import { TicketsWallet } from "@/modules/ticketing/features/wallet/components/TicketsWallet";
import * as ticketService from "@/modules/ticketing/api/ticketService";
import type { TicketListItem } from "@/shared/types/api";
import { getApiErrorMessage } from "@/shared/utils/errors";

type TicketFilter = "all" | "ACTIVE" | "USED" | "CANCELLED";

const FILTER_OPTIONS: { label: string; value: TicketFilter }[] = [
  { label: "Todos", value: "all" },
  { label: "Ativos", value: "ACTIVE" },
  { label: "Utilizados", value: "USED" },
  { label: "Cancelados", value: "CANCELLED" },
];

/** Conta ingressos com status exato na lista carregada. */
function countByStatus(tickets: TicketListItem[], status: string) {
  return tickets.filter((ticket) => ticket.status === status).length;
}

/**
 * Lista ingressos do usuário com estatísticas, filtro por status e componente wallet.
 */
export function MyTicketsPage() {
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TicketFilter>("all");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const statusParam = filter === "all" ? undefined : filter;

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    ticketService
      .fetchMyTicketsPage({ status: statusParam })
      .then((page) => {
        if (!cancelled) {
          setTickets(page.tickets);
          setNextCursor(page.nextCursor);
          setHasNextPage(page.hasNextPage);
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
  }, [statusParam]);

  async function handleLoadMore() {
    if (!hasNextPage || !nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      const page = await ticketService.fetchMyTicketsPage({
        cursor: nextCursor,
        status: statusParam,
      });
      setTickets((current) => [...current, ...page.tickets]);
      setNextCursor(page.nextCursor);
      setHasNextPage(page.hasNextPage);
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível carregar mais ingressos."));
    } finally {
      setLoadingMore(false);
    }
  }

  const displayedTickets = useMemo(
    () => ticketService.sortTicketsByEventDate(tickets),
    [tickets],
  );

  const stats = useMemo(
    () => ({
      total: tickets.length,
      active: countByStatus(tickets, "ACTIVE"),
      used: countByStatus(tickets, "USED"),
    }),
    [tickets],
  );

  const showTicketsSection = tickets.length > 0 || filter !== "all";

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
          description="Sua carteira digital de ingressos. Toque em um cartão para abrir o QR Code e salvar na Apple ou Google Wallet."
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

      {!error && showTicketsSection ? (
        <>
          <AnimatedSection delayMs={60}>
            <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="md">
              <StatCard label="Total" value={String(stats.total)} icon={<IconTicket size={20} />} />
              <StatCard
                label="Ativos"
                value={String(stats.active)}
                icon={<IconCalendarEvent size={20} />}
                iconColor="green"
                valueColor="green"
              />
              <StatCard
                label="Utilizados"
                value={String(stats.used)}
                icon={<IconCircleCheck size={20} />}
                iconColor="blue"
                valueColor="blue"
              />
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

          {tickets.length === 0 ? (
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
            <AnimatedSection delayMs={120}>
              <TicketsWallet tickets={displayedTickets} />
            </AnimatedSection>
          )}

          <AnimatedSection delayMs={140}>
            <Button
              variant="light"
              radius="xl"
              fullWidth
              loading={loadingMore}
              disabled={!hasNextPage}
              onClick={() => void handleLoadMore()}
            >
              Carregar mais
            </Button>
          </AnimatedSection>
        </>
      ) : null}

      {!error && !showTicketsSection ? (
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
