import { Badge, Card, Center, Group, Stack, Text, Title } from "@mantine/core";
import { IconCalendar, IconMapPin, IconTicket } from "@tabler/icons-react";
import { QRCodeSVG } from "qrcode.react";
import type { TicketListItem } from "../types/api";
import { formatShortDate } from "../utils/format";
import { getTicketStatusColor, getTicketStatusLabel } from "../utils/statusLabels";

interface TicketCardProps {
  ticket: TicketListItem;
}

export function TicketCard({ ticket }: TicketCardProps) {
  const showQr = ticket.status === "ACTIVE";

  return (
    <Card padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <IconTicket size={22} color="var(--mantine-color-brand-6)" />
            <Title order={4} lineClamp={2}>
              {ticket.event.title}
            </Title>
          </Group>
          <Badge color={getTicketStatusColor(ticket.status)} variant="light">
            {getTicketStatusLabel(ticket.status)}
          </Badge>
        </Group>

        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            Lote: {ticket.ticketLot.name}
          </Text>
          <Group gap="xs" c="dimmed">
            <IconCalendar size={16} />
            <Text size="sm">{formatShortDate(ticket.event.date)}</Text>
          </Group>
          <Group gap="xs" c="dimmed">
            <IconMapPin size={16} />
            <Text size="sm">{ticket.event.location}</Text>
          </Group>
        </Stack>

        {showQr ? (
          <Center>
            <Stack gap="xs" align="center">
              <PaperLikeQr code={ticket.uniqueCode} />
              <Text size="xs" c="dimmed" ta="center">
                Apresente este QR na entrada do evento
              </Text>
            </Stack>
          </Center>
        ) : null}

        <Stack gap={4}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            Código do ingresso
          </Text>
          <Text ff="monospace" size="sm" style={{ wordBreak: "break-all" }}>
            {ticket.uniqueCode}
          </Text>
        </Stack>

        {ticket.checkedInAt ? (
          <Text size="sm" c="blue">
            Check-in em {formatShortDate(ticket.checkedInAt)}
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
}

function PaperLikeQr({ code }: { code: string }) {
  return (
    <div
      style={{
        padding: 12,
        background: "var(--mantine-color-white)",
        borderRadius: 8,
        border: "1px solid var(--mantine-color-default-border)",
      }}
    >
      <QRCodeSVG value={code} size={160} level="M" includeMargin={false} />
    </div>
  );
}
