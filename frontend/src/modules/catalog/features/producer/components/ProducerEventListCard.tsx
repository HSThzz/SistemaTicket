import { ActionIcon, Box, Button, Group, Stack, Text, Title, Tooltip } from "@mantine/core";
import { Link } from "react-router-dom";
import {
  IconCalendar,
  IconClock,
  IconMapPin,
  IconPencil,
  IconTicket,
  IconTrash,
} from "@tabler/icons-react";
import {
  EventPrivateBadge,
  isPrivateEvent,
} from "@/modules/catalog/features/browse/components/EventPrivateBadge";
import { EventStatusBadge } from "@/components/ui/EventStatusBadge";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import type { Event } from "@/shared/types/api";
import { extractCity, getEventCoverStyle, getTotalAvailable } from "@/modules/catalog/utils/eventVisuals";
import { formatEventDateOnly, formatEventTimeOnly } from "@/shared/utils/format";
import { canDeleteEventFromList, toEventStatus } from "@/modules/catalog/features/producer/utils/eventStatus";

interface ProducerEventListCardProps {
  event: Event;
  onDelete?: (event: Event) => void;
  deleting?: boolean;
}

/**
 * Linha compacta de evento — foco em gestão (status, data, lotes, ação).
 */
export function ProducerEventListCard({
  event,
  onDelete,
  deleting = false,
}: ProducerEventListCardProps) {
  const totalAvailable = getTotalAvailable(event);
  const soldOut = totalAvailable === 0 && event.ticketLots.length > 0;
  const hasLots = event.ticketLots.length > 0;
  const canDelete = canDeleteEventFromList(toEventStatus(event.status));

  return (
    <Box className="producer-event-list-row">
      <Group wrap="nowrap" align="stretch" gap={0}>
        <Box className="producer-event-list-cover" style={getEventCoverStyle(event)} />

        <Group
          justify="space-between"
          align="center"
          wrap="wrap"
          gap="md"
          className="producer-event-list-body"
          flex={1}
        >
          <Stack gap={6} flex={1} miw={200}>
            <Group gap="xs" wrap="wrap">
              <EventStatusBadge status={event.status} size="xs" />
              {isPrivateEvent(event) ? <EventPrivateBadge size="xs" /> : null}
              {(event.pendingParticipationCount ?? 0) > 0 ? (
                <PremiumBadge tone="warning" size="xs">
                  {event.pendingParticipationCount} pendente
                  {(event.pendingParticipationCount ?? 0) === 1 ? "" : "s"}
                </PremiumBadge>
              ) : null}
              {hasLots ? (
                <PremiumBadge tone="neutral" size="xs">
                  {event.ticketLots.length} lote{event.ticketLots.length === 1 ? "" : "s"}
                </PremiumBadge>
              ) : (
                <PremiumBadge tone="warning" size="xs">
                  Sem lotes
                </PremiumBadge>
              )}
            </Group>

            <Title order={5} lineClamp={1}>
              {event.title}
            </Title>

            <Group gap="md" c="dimmed" wrap="wrap">
              <Group gap={6} wrap="nowrap">
                <IconCalendar size={14} />
                <Text size="xs">{formatEventDateOnly(event.date)}</Text>
              </Group>
              <Group gap={6} wrap="nowrap">
                <IconClock size={14} />
                <Text size="xs">{formatEventTimeOnly(event.date)}</Text>
              </Group>
              <Group gap={6} wrap="nowrap" maw={220}>
                <IconMapPin size={14} style={{ flexShrink: 0 }} />
                <Text size="xs" lineClamp={1}>
                  {extractCity(event.location)}
                </Text>
              </Group>
              <Group gap={6} wrap="nowrap">
                <IconTicket size={14} />
                <Text size="xs">
                  {!hasLots
                    ? "Configure lotes"
                    : soldOut
                      ? "Esgotado"
                      : `${totalAvailable} disponíveis`}
                </Text>
              </Group>
            </Group>
          </Stack>

          <Group gap="xs" wrap="nowrap" className="producer-event-list-actions">
            {canDelete && onDelete ? (
              <Tooltip label="Remover da lista" withArrow>
                <ActionIcon
                  variant="light"
                  color="red"
                  radius="xl"
                  size="lg"
                  aria-label="Remover evento da lista"
                  onClick={() => onDelete(event)}
                  loading={deleting}
                  disabled={deleting}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            ) : null}

            <Button
              component={Link}
              to={`/produtor/eventos/${event.id}`}
              variant="light"
              radius="xl"
              size="sm"
              leftSection={<IconPencil size={16} />}
              className="producer-event-list-action"
            >
              Gerenciar
            </Button>
          </Group>
        </Group>
      </Group>
    </Box>
  );
}
