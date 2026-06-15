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

import { EmptyState } from "../../components/account/EmptyState";

import { PageHeader } from "../../components/account/PageHeader";

import { PremiumPaper } from "../../components/account/PremiumPaper";

import { StatCard } from "../../components/account/StatCard";

import { ProducerDashboardAlerts } from "../../components/producer/ProducerDashboardAlerts";

import { ProducerDashboardPerformanceTable } from "../../components/producer/ProducerDashboardPerformanceTable";

import { ProducerNav } from "../../components/producer/ProducerNav";

import { ProducerPanelSkeleton } from "../../components/producer/ProducerPanelSkeleton";

import { ProducerTopPerformers } from "../../components/producer/ProducerTopPerformers";

import * as eventService from "../../features/catalog/api/eventService";

import type { ProducerDashboardStats } from "../../types/api";

import { formatCurrencyFromCents } from "../../utils/format";

import { getApiErrorMessage } from "../../utils/errors";



const DASHBOARD_HEADER = (

  <PageHeader

    icon={<IconLayoutDashboard size={28} color="var(--mantine-color-brand-6)" />}

    title="Dashboard de"

    highlight="vendas"

    description="Acompanhe receita, ocupação, check-ins e o que precisa da sua atenção agora."

  />

);



/**

 * Painel analítico do produtor — métricas, alertas e ranking de desempenho.

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



  const derived = useMemo(() => {

    if (!stats) {

      return null;

    }



    const checkInRate =

      stats.summary.ticketsSold > 0

        ? Math.round((stats.summary.ticketsCheckedIn / stats.summary.ticketsSold) * 100)

        : 0;



    const pendingCheckIns = stats.summary.ticketsSold - stats.summary.ticketsCheckedIn;

    const draftEvents = stats.summary.totalEvents - stats.summary.publishedEvents;



    return {

      checkInRate,

      pendingCheckIns,

      draftEvents,

    };

  }, [stats]);



  if (loading) {

    return (

      <Stack gap="lg">

        {DASHBOARD_HEADER}

        <ProducerNav />

        <ProducerPanelSkeleton variant="dashboard" />

      </Stack>

    );

  }



  if (error || !stats || !derived) {

    return (

      <Stack gap="lg">

        {DASHBOARD_HEADER}

        <ProducerNav />

        <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro" radius="lg">

          {error ?? "Dados indisponíveis."}

        </Alert>

      </Stack>

    );

  }



  return (

    <Stack gap="lg">

      {DASHBOARD_HEADER}



      <ProducerNav />



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

          label="Check-ins realizados"

          value={String(stats.summary.ticketsCheckedIn)}

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



      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">

        <StatCard

          label="Eventos cadastrados"

          value={String(stats.summary.totalEvents)}

          icon={<IconCalendarEvent size={20} />}

          iconColor="gray"

        />

        <StatCard

          label="Eventos publicados"

          value={String(stats.summary.publishedEvents)}

          icon={<IconCalendarEvent size={20} />}

          iconColor="teal"

          valueColor="teal"

        />

        <StatCard

          label="Check-ins pendentes"

          value={String(derived.pendingCheckIns)}

          icon={<IconScan size={20} />}

          iconColor={derived.pendingCheckIns > 0 ? "orange" : "gray"}

          valueColor={derived.pendingCheckIns > 0 ? "orange" : undefined}

        />

      </SimpleGrid>



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

      ) : (

        <>

          <ProducerDashboardAlerts events={stats.events} />



          <Grid gap="lg">

            <Grid.Col span={{ base: 12, lg: 5 }}>

              <Stack gap="md">

                <Stack gap={4}>

                  <Title order={3} size="h4">

                    Melhores desempenhos

                  </Title>

                  <Text c="dimmed" size="sm">

                    Eventos com maior receita até o momento.

                  </Text>

                </Stack>

                <ProducerTopPerformers events={stats.events} />

              </Stack>

            </Grid.Col>



            <Grid.Col span={{ base: 12, lg: 7 }}>

              <PremiumPaper p="lg" className="producer-dashboard-insight">

                <Stack gap="md">

                  <Title order={4} size="h5">

                    Resumo rápido

                  </Title>

                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">

                    <BoxInsight

                      label="Rascunhos"

                      value={String(derived.draftEvents)}

                      hint={

                        derived.draftEvents > 0

                          ? "Publique para liberar vendas"

                          : "Todos os eventos estão publicados"

                      }

                    />

                    <BoxInsight

                      label="Média por evento"

                      value={formatCurrencyFromCents(

                        stats.summary.publishedEvents > 0

                          ? Math.round(

                              stats.summary.grossRevenueCents / stats.summary.publishedEvents,

                            )

                          : 0,

                      )}

                      hint="Receita média dos eventos publicados"

                    />

                  </SimpleGrid>

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

                </Stack>

              </PremiumPaper>

            </Grid.Col>

          </Grid>



          <Stack gap="md">

            <Group justify="space-between" align="center" wrap="wrap" gap="sm">

              <Stack gap={4}>

                <Title order={3} size="h4">

                  Desempenho por evento

                </Title>

                <Text c="dimmed" size="sm">

                  Visão consolidada de vendas, check-in e ocupação.

                </Text>

              </Stack>

              <Badge size="lg" variant="light" color="brand" radius="sm">

                {stats.events.length} evento{stats.events.length === 1 ? "" : "s"}

              </Badge>

            </Group>



            <ProducerDashboardPerformanceTable events={stats.events} />

          </Stack>

        </>

      )}

    </Stack>

  );

}



function BoxInsight({

  label,

  value,

  hint,

}: {

  label: string;

  value: string;

  hint: string;

}) {

  return (

    <Stack gap={4} className="producer-dashboard-insight-item">

      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>

        {label}

      </Text>

      <Text fw={800} size="xl">

        {value}

      </Text>

      <Text size="xs" c="dimmed">

        {hint}

      </Text>

    </Stack>

  );

}

