/**
 * @file Página “Meus pedidos” com cards premium e filtro por status de pagamento.
 * @module pages/MyOrdersPage
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
  Grid,
  SegmentedControl,
  SimpleGrid,
  Stack,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconReceipt,
  IconReceipt2,
  IconSearch,
  IconWallet,
} from "@tabler/icons-react";
import { AnimatedSection } from "../components/home/AnimatedSection";
import { EmptyState } from "../components/account/EmptyState";
import { OrdersPageSkeleton } from "../components/account/OrdersPageSkeleton";
import { PageHeader } from "../components/account/PageHeader";
import { StatCard } from "../components/account/StatCard";
import { OrderCard } from "../components/OrderCard";
import * as orderService from "../features/sales/api/orderService";
import type { OrderListItem } from "../types/api";
import { formatCurrencyFromCents } from "../utils/format";
import { getApiErrorMessage } from "../utils/errors";

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
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderFilter>("all");

  useEffect(() => {
    let cancelled = false;

    orderService
      .listMyOrders()
      .then((data) => {
        if (!cancelled) {
          setOrders(data);
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
  }, []);

  const filteredOrders = useMemo(() => {
    if (filter === "all") {
      return orders;
    }
    return orders.filter((order) => order.status === filter);
  }, [orders, filter]);

  const stats = useMemo(() => {
    const paidOrders = orders.filter((order) => order.status === "PAID");
    const totalSpent = paidOrders.reduce((sum, order) => sum + order.totalPrice, 0);

    return {
      total: orders.length,
      paid: paidOrders.length,
      totalSpent,
    };
  }, [orders]);

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
          description="Histórico de compras, pagamentos PIX e status de cada reserva. Acompanhe tudo em um só lugar."
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

      {!error && orders.length > 0 ? (
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
            <SegmentedControl
              className="filter-pills"
              value={filter}
              onChange={(value) => setFilter(value as OrderFilter)}
              data={FILTER_OPTIONS}
              radius="xl"
              fullWidth
              size="sm"
            />
          </AnimatedSection>

          {filteredOrders.length === 0 ? (
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
            <Grid>
              {filteredOrders.map((order, index) => (
                <Grid.Col key={order.id} span={{ base: 12, lg: 6 }}>
                  <AnimatedSection delayMs={120 + index * 40}>
                    <OrderCard order={order} />
                  </AnimatedSection>
                </Grid.Col>
              ))}
            </Grid>
          )}
        </>
      ) : null}

      {!error && orders.length === 0 ? (
        <AnimatedSection delayMs={60}>
          <EmptyState
            icon={<IconReceipt2 size={32} />}
            title="Nenhum pedido ainda"
            description="Quando você reservar ingressos e pagar com PIX, seus pedidos aparecerão aqui com o status do pagamento."
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
