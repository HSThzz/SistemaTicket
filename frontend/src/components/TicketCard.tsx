import { Link } from "react-router-dom";
import {
  Anchor,
  Badge,
  Box,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconCalendar,
  IconCheck,
  IconMapPin,
  IconTicket,
} from "@tabler/icons-react";
import { QRCodeSVG } from "qrcode.react";
import type { TicketListItem } from "../types/api";
import { extractCity, getEventCoverStyle } from "../utils/eventVisuals";
import { formatCurrencyFromCents, formatShortDate } from "../utils/format";
import { getTicketStatusColor, getTicketStatusLabel } from "../utils/statusLabels";

interface TicketCardProps {
  ticket: TicketListItem;
}

export function TicketCard({ ticket }: TicketCardProps) {
  const isActive = ticket.status === "ACTIVE";
  const isUsed = ticket.status === "USED";
  const eventHref = `/eventos/${ticket.event.id}`;

  return (
    <Paper
      radius="lg"
      className={`ticket-card-premium ${!isActive ? "is-inactive" : ""}`}
      component="article"
    >
      <Group wrap="nowrap" align="stretch" gap={0}>
        <Box className="ticket-card-stub" style={getEventCoverStyle(ticket.event)}>
          <ThemeIcon size={36} radius="md" variant="white" color="dark" style={{ opacity: 0.92 }}>
            <IconTicket size={20} stroke={1.6} />
          </ThemeIcon>
          <Text size="xs" c="white" fw={700} ta="center" style={{ opacity: 0.95, lineHeight: 1.2 }}>
            {ticket.ticketLot.name}
          </Text>
        </Box>

        <Stack gap="lg" className="ticket-card-body">
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
            <Stack gap={6} flex={1} miw={0}>
              <Anchor
                component={Link}
                to={eventHref}
                underline="never"
                c="inherit"
                style={{ textDecoration: "none" }}
              >
                <Title order={4} lineClamp={2} style={{ letterSpacing: "-0.01em" }}>
                  {ticket.event.title}
                </Title>
              </Anchor>
              <Text size="sm" c="dimmed" fw={500}>
                {formatCurrencyFromCents(ticket.ticketLot.price)}
              </Text>
            </Stack>
            <Badge color={getTicketStatusColor(ticket.status)} variant="light" radius="sm">
              {getTicketStatusLabel(ticket.status)}
            </Badge>
          </Group>

          <Stack gap="sm">
            <Group gap={10} c="dimmed" wrap="nowrap">
              <IconCalendar size={16} style={{ flexShrink: 0 }} />
              <Text size="sm" lineClamp={1}>
                {formatShortDate(ticket.event.date)}
              </Text>
            </Group>
            <Group gap={10} c="dimmed" wrap="nowrap" align="flex-start">
              <IconMapPin size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <Text size="sm" lineClamp={2}>
                {extractCity(ticket.event.location)}
              </Text>
            </Group>
          </Stack>

          {isActive ? (
            <Group justify="center" py="sm">
              <Stack gap="sm" align="center">
                <Box className="ticket-qr-frame">
                  <QRCodeSVG value={ticket.uniqueCode} size={148} level="M" includeMargin={false} />
                </Box>
                <Text size="xs" c="dimmed" ta="center" maw={220}>
                  Apresente este QR na entrada do evento
                </Text>
              </Stack>
            </Group>
          ) : null}

          {isUsed && ticket.checkedInAt ? (
            <Group gap="xs" c="blue">
              <IconCheck size={16} />
              <Text size="sm" fw={500}>
                Check-in em {formatShortDate(ticket.checkedInAt)}
              </Text>
            </Group>
          ) : null}

          <Box className="ticket-code-block">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={6}>
              Código do ingresso
            </Text>
            <Text ff="monospace" size="sm" fw={500} style={{ wordBreak: "break-all" }}>
              {ticket.uniqueCode}
            </Text>
          </Box>

          <Anchor component={Link} to={eventHref} size="sm" fw={600}>
            Ver detalhes do evento →
          </Anchor>
        </Stack>
      </Group>
    </Paper>
  );
}
