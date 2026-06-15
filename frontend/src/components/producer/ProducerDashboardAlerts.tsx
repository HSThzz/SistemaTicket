/**
 * @file Alertas operacionais do dashboard do produtor.
 */

import { Alert, Stack, Text } from "@mantine/core";
import { IconAlertTriangle, IconCalendarEvent, IconFileText } from "@tabler/icons-react";
import type { ProducerEventStats } from "../../types/api";

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
 * Destaca rascunhos, eventos próximos e check-ins pendentes.
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

  const alerts: { color: string; icon: typeof IconFileText; title: string; message: string }[] = [];

  if (drafts.length > 0) {
    alerts.push({
      color: "yellow",
      icon: IconFileText,
      title: `${drafts.length} rascunho${drafts.length === 1 ? "" : "s"} aguardando publicação`,
      message:
        drafts.length === 1
          ? `"${drafts[0].title}" ainda não está visível para o público.`
          : "Publique seus eventos para começar a vender ingressos.",
    });
  }

  if (upcoming.length > 0) {
    alerts.push({
      color: "blue",
      icon: IconCalendarEvent,
      title: `${upcoming.length} evento${upcoming.length === 1 ? "" : "s"} nos próximos 7 dias`,
      message: "Revise lotes, capacidade e equipe de check-in antes da data.",
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
      message: "Há ingressos vendidos ainda não validados na entrada.",
    });
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Stack gap="sm">
      {alerts.map((alert) => (
        <Alert
          key={alert.title}
          color={alert.color}
          radius="lg"
          variant="light"
          icon={<alert.icon size={18} />}
          title={alert.title}
        >
          <Text size="sm">{alert.message}</Text>
        </Alert>
      ))}
    </Stack>
  );
}
