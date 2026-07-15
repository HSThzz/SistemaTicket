/**
 * @file Página “Meus pedidos” com cards premium e filtro por status de pagamento.
 * @module pages/MyOrdersPage
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  SegmentedControl,
  SimpleGrid,
  Stack,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconAlertCircle,
  IconReceipt,
  IconReceipt2,
  IconSearch,
  IconWallet,
} from "@tabler/icons-react";
import { AnimatedSection } from "@/shared/components/AnimatedSection";
import { EmptyState } from "@/shared/components/EmptyState";
import { OrdersPageSkeleton } from "@/modules/sales/features/orders/components/OrdersPageSkeleton";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatCard } from "@/shared/components/StatCard";
import { OrderCard } from "@/modules/sales/features/orders/components/OrderCard";
import * as orderService from "@/modules/sales/api/orderService";
import type { OrderListItem } from "@/shared/types/api";
import { formatCurrencyFromCents } from "@/shared/utils/format";
import { getApiErrorMessage } from "@/shared/utils/errors";

type OrderFilter = "all" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";

const FILTER_OPTIONS: { label: string; value: OrderFilter }[] = [
  { label: "Todos", value: "all" },
  { label: "Pendentes", value: "PENDING" },
  { label: "Pagos", value: "PAID" },
  { label: "Falhos", value: "FAILED" },
  { label: "Reembolsados", value: "REFUNDED" },
];

/**
 * Lista pedidos do cliente com totais, filtro e {@link OrderCard} por item.
 */
export function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isNarrow = useMediaQuery("(max-width: 47.99em)");
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const statusParam = filter === "all" ? undefined : filter;

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    orderService
      .fetchMyOrdersPage({ status: statusParam })
      .then((page) => {
        if (!cancelled) {
          setOrders(page.orders);
          setNextCursor(page.nextCursor);
          setHasNextPage(page.hasNextPage);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Não foi possível carregar seus pedidos."));
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
      const page = await orderService.fetchMyOrdersPage({
        cursor: nextCursor,
        status: statusParam,
      });
      setOrders((current) => [...current, ...page.orders]);
      setNextCursor(page.nextCursor);
      setHasNextPage(page.hasNextPage);
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível carregar mais pedidos."));
    } finally {
      setLoadingMore(false);
    }
  }

  const stats = useMemo(() => {
    const paidOrders = orders.filter((order) => order.status === "PAID");
    const totalSpent = paidOrders.reduce((sum, order) => sum + order.totalPrice, 0);

    return {
      total: orders.length,
      paid: paidOrders.length,
      totalSpent,
    };
  }, [orders]);

  const showOrdersSection = orders.length > 0 || filter !== "all";

  if (loading) {
    return <OrdersPageSkeleton />;
  }

  return (
    <Stack gap="lg">
      <AnimatedSection>
        <PageHeader
          icon={<IconReceipt2 size={28} color="var(--mantine-color-brand-6)" />}
          title="Meus"
          highlight="pedidos"
          description="Histórico de compras, pagamentos e status de cada reserva. Acompanhe tudo em um só lugar."
          action={
            <Button
              component={Link}
              to="/ingressos"
              variant="light"
              radius="xl"
              leftSection={<IconReceipt size={18} />}
              visibleFrom="xs"
            >
              Meus ingressos
            </Button>
          }
        />
      </AnimatedSection>

      {error ? (
        <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro ao carregar" radius="lg">
          {error}
        </Alert>
      ) : null}

      {!error && showOrdersSection ? (
        <>
          <AnimatedSection delayMs={60}>
            <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="md">
              <StatCard label="Pedidos" value={String(stats.total)} icon={<IconReceipt2 size={20} />} />
              <StatCard
                label="Pagos"
                value={String(stats.paid)}
                icon={<IconWallet size={20} />}
                iconColor="green"
                valueColor="green"
              />
              <StatCard
                label="Total gasto"
                value={formatCurrencyFromCents(stats.totalSpent)}
                icon={<IconWallet size={20} />}
                iconColor="teal"
                valueColor="teal"
              />
            </SimpleGrid>
          </AnimatedSection>

          <AnimatedSection delayMs={100}>
            <Box className="filter-pills-scroll">
              <SegmentedControl
                className="filter-pills"
                value={filter}
                onChange={(value) => setFilter(value as OrderFilter)}
                data={FILTER_OPTIONS}
                radius="xl"
                fullWidth={!isNarrow}
                size="sm"
              />
            </Box>
          </AnimatedSection>

          {orders.length === 0 ? (
            <AnimatedSection delayMs={120}>
              <EmptyState
                icon={<IconReceipt2 size={32} />}
                title="Nenhum pedido neste filtro"
                description="Tente outro status ou explore eventos para fazer uma nova compra."
                action={
                  <Button component={Link} to="/" variant="light" radius="xl">
                    Ver eventos
                  </Button>
                }
              />
            </AnimatedSection>
          ) : (
            <Stack gap="md" className="orders-list-section">
              <Stack gap="md" className="orders-list">
                {orders.map((order, index) => (
                  <AnimatedSection key={order.id} delayMs={120 + index * 40}>
                    <OrderCard order={order} />
                  </AnimatedSection>
                ))}
              </Stack>

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
            </Stack>
          )}
        </>
      ) : null}

      {!error && !showOrdersSection ? (
        <AnimatedSection delayMs={60}>
          <EmptyState
            icon={<IconReceipt2 size={32} />}
            title="Nenhum pedido ainda"
            description="Quando você reservar ingressos e concluir o pagamento, seus pedidos aparecerão aqui com o status de cada compra."
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

      {!error && orders.length > 0 ? (
        <Button
          component={Link}
          to="/ingressos"
          variant="subtle"
          radius="xl"
          leftSection={<IconReceipt size={18} />}
          hiddenFrom="xs"
          fullWidth
        >
          Meus ingressos
        </Button>
      ) : null}
    </Stack>
  );
}
