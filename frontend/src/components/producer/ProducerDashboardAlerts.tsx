/**
 * @file Alertas operacionais do dashboard do produtor.
 */

import { Badge, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconAlertTriangle, IconCalendarEvent, IconFileText } from "@tabler/icons-react";
import { PremiumPaper } from "../account/PremiumPaper";
import type { ProducerEventStats } from "@/shared/types/api";

interface ProducerDashboardAlertsProps {
  events: ProducerEventStats[];
}

function isUpcomingWithinDays(isoDate: string, days: number): boolean {
  const eventDate = new Date(isoDate);
  const now = new Date();
  const limit = new Date();
  limit.setDate(limit.getDate() + days);

  return eventDate >= now && eventDate <= limit;
}

function isTodayOrPast(isoDate: string): boolean {
  const eventDate = new Date(isoDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return eventDate <= today;
}

/**
 * Destaca rascunhos, eventos próximos e check-ins pendentes em um único bloco.
 */
export function ProducerDashboardAlerts({ events }: ProducerDashboardAlertsProps) {
  const drafts = events.filter((event) => event.status === "DRAFT");
  const upcoming = events.filter(
    (event) => event.status === "PUBLISHED" && isUpcomingWithinDays(event.date, 7),
  );
  const pendingCheckIn = events.filter(
    (event) =>
      event.ticketsSold > event.ticketsCheckedIn &&
      event.status === "PUBLISHED" &&
      isTodayOrPast(event.date),
  );

  const alerts: { color: string; icon: typeof IconFileText; title: string; message: string }[] =
    [];

  if (drafts.length > 0) {
    alerts.push({
      color: "yellow",
      icon: IconFileText,
      title: `${drafts.length} rascunho${drafts.length === 1 ? "" : "s"}`,
      message:
        drafts.length === 1
          ? `"${drafts[0].title}" ainda não está visível para o público.`
          : "Publique para liberar vendas na vitrine.",
    });
  }

  if (upcoming.length > 0) {
    alerts.push({
      color: "blue",
      icon: IconCalendarEvent,
      title: `${upcoming.length} evento${upcoming.length === 1 ? "" : "s"} em 7 dias`,
      message: "Revise lotes, capacidade e equipe de check-in.",
    });
  }

  if (pendingCheckIn.length > 0) {
    const totalPending = pendingCheckIn.reduce(
      (sum, event) => sum + (event.ticketsSold - event.ticketsCheckedIn),
      0,
    );

    alerts.push({
      color: "orange",
      icon: IconAlertTriangle,
      title: `${totalPending} check-in${totalPending === 1 ? "" : "s"} pendente${totalPending === 1 ? "" : "s"}`,
      message: "Ingressos vendidos ainda não validados na entrada.",
    });
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <PremiumPaper p="md" className="producer-dashboard-alerts">
      <Group gap="sm" mb="sm" wrap="nowrap">
        <ThemeIcon size={32} radius="md" variant="light" color="orange">
          <IconAlertTriangle size={16} />
        </ThemeIcon>
        <Text fw={700} size="sm">
          Precisa da sua atenção
        </Text>
      </Group>
      <Stack gap="sm">
        {alerts.map((alert) => (
          <Group key={alert.title} gap="sm" align="flex-start" wrap="nowrap">
            <Badge color={alert.color} variant="light" radius="sm" mt={2}>
              <alert.icon size={12} />
            </Badge>
            <Text size="sm" style={{ lineHeight: 1.45 }}>
              <Text span fw={600}>
                {alert.title}
              </Text>
              {" — "}
              {alert.message}
            </Text>
          </Group>
        ))}
      </Stack>
    </PremiumPaper>
  );
}
