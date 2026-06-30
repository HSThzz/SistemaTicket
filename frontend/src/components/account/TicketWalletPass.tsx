import { Box, Group, Stack, Text, Title } from "@mantine/core";
import { IconCalendar, IconMapPin, IconTicket } from "@tabler/icons-react";
import { PremiumBadge } from "../ui/PremiumBadge";
import { TicketStatusBadge } from "../ui/TicketStatusBadge";
import type { TicketListItem } from "@/shared/types/api";
import { extractCity, getEventCoverStyle } from "@/modules/catalog/utils/eventVisuals";
import { formatCurrencyFromCents, formatShortDate } from "@/shared/utils/format";

interface TicketWalletPassProps {
  ticket: TicketListItem;
  isSelected: boolean;
  onSelect: () => void;
}

export function TicketWalletPass({ ticket, isSelected, onSelect }: TicketWalletPassProps) {
  const isActive = ticket.status === "ACTIVE";

  return (
    <Box
      component="button"
      type="button"
      className={`ticket-wallet-pass ${isSelected ? "is-selected" : ""} ${!isActive ? "is-inactive" : ""}`}
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`Ingresso ${ticket.event.title}`}
    >
      <Box className="ticket-wallet-pass-face" style={getEventCoverStyle(ticket.event)}>
        <Box className="ticket-wallet-pass-shade" aria-hidden />
        <Stack gap="sm" className="ticket-wallet-pass-face-content">
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
            <Group gap="xs" wrap="wrap">
              <TicketStatusBadge
                status={ticket.status}
                size="xs"
                overlay
                className="ticket-wallet-pass-badge"
              />
              <PremiumBadge
                tone="neutral"
                size="xs"
                overlay
                className="ticket-wallet-pass-badge"
              >
                {ticket.ticketLot.name}
              </PremiumBadge>
            </Group>
            <Box className="ticket-wallet-pass-chip" aria-hidden>
              <IconTicket size={14} />
            </Box>
          </Group>

          <Title order={4} c="white" lineClamp={2} className="ticket-wallet-pass-title">
            {ticket.event.title}
          </Title>

          <Group gap="md" wrap="wrap" className="ticket-wallet-pass-meta">
            <Group gap={6} wrap="nowrap">
              <IconCalendar size={14} style={{ flexShrink: 0, opacity: 0.9 }} />
              <Text size="xs" c="white" fw={500}>
                {formatShortDate(ticket.event.date)}
              </Text>
            </Group>
            <Group gap={6} wrap="nowrap">
              <IconMapPin size={14} style={{ flexShrink: 0, opacity: 0.9 }} />
              <Text size="xs" c="white" fw={500} lineClamp={1}>
                {extractCity(ticket.event.location)}
              </Text>
            </Group>
          </Group>

          <Text size="xs" c="white" fw={700} style={{ opacity: 0.92 }}>
            {formatCurrencyFromCents(ticket.ticketLot.price)}
          </Text>
        </Stack>
      </Box>
    </Box>
  );
}
