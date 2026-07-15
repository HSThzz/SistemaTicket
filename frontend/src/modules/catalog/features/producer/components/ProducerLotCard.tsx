import {
  ActionIcon,
  Box,
  Group,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconPencil, IconTicket, IconTrash } from "@tabler/icons-react";
import { LotStockBadge } from "@/components/ui/LotStockBadge";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import type { TicketLot } from "@/shared/types/api";
import { formatLotPrice } from "@/shared/utils/format";

interface ProducerLotCardProps {
  lot: TicketLot;
  canEdit?: boolean;
  canDelete?: boolean;
  deleting?: boolean;
  onEdit?: (lot: TicketLot) => void;
  onDelete?: (lot: TicketLot) => void;
}

export function ProducerLotCard({
  lot,
  canEdit = false,
  canDelete = false,
  deleting = false,
  onEdit,
  onDelete,
}: ProducerLotCardProps) {
  const sold = lot.totalQuantity - lot.availableQuantity;
  const soldPct =
    lot.totalQuantity > 0 ? Math.round((sold / lot.totalQuantity) * 100) : 0;
  const onePerDocument = lot.maxPerDocument === 1;
  const showActions = (canEdit && onEdit) || (canDelete && onDelete);

  return (
    <Box className="producer-lot-card">
      <Box className="producer-lot-card__header">
        <Group
          className="producer-lot-card__main"
          gap="md"
          wrap="nowrap"
          align="flex-start"
        >
          <ThemeIcon size={44} radius="md" variant="light" color="brand" flex="none">
            <IconTicket size={22} />
          </ThemeIcon>
          <Stack gap={8} style={{ minWidth: 0, flex: 1 }}>
            <Group gap="xs" wrap="wrap">
              <Title
                order={4}
                style={{ letterSpacing: "-0.01em" }}
                lineClamp={2}
              >
                {lot.name}
              </Title>
              {onePerDocument ? (
                <PremiumBadge tone="paid" size="xs">
                  1 por CPF
                </PremiumBadge>
              ) : null}
            </Group>
            <Text fw={800} size="xl" c="brand" className="producer-metric-value">
              {formatLotPrice(lot.price)}
            </Text>
            <LotStockBadge availableQuantity={lot.availableQuantity} />
          </Stack>
        </Group>

        {showActions ? (
          <Group className="producer-lot-card__actions" gap={6} wrap="nowrap">
            {canEdit && onEdit ? (
              <Tooltip label="Editar lote">
                <ActionIcon
                  variant="light"
                  color="brand"
                  radius="md"
                  size="lg"
                  aria-label={`Editar lote ${lot.name}`}
                  onClick={() => onEdit(lot)}
                >
                  <IconPencil size={18} />
                </ActionIcon>
              </Tooltip>
            ) : null}
            {canDelete && onDelete ? (
              <Tooltip label="Apagar lote">
                <ActionIcon
                  variant="light"
                  color="red"
                  radius="md"
                  size="lg"
                  loading={deleting}
                  aria-label={`Apagar lote ${lot.name}`}
                  onClick={() => onDelete(lot)}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Tooltip>
            ) : null}
          </Group>
        ) : null}
      </Box>

      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md" mt="lg">
        <Box className="producer-lot-stat">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
            Total
          </Text>
          <Text fw={700} size="lg">
            {lot.totalQuantity}
          </Text>
        </Box>
        <Box className="producer-lot-stat">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
            Vendidos
          </Text>
          <Text fw={700} size="lg">
            {sold}
          </Text>
        </Box>
        <Box className="producer-lot-stat">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
            Restantes
          </Text>
          <Text fw={700} size="lg" c={lot.availableQuantity === 0 ? "red" : undefined}>
            {lot.availableQuantity}
          </Text>
        </Box>
      </SimpleGrid>

      <Stack gap={6} mt="lg">
        <Group justify="space-between">
          <Text size="xs" c="dimmed" fw={600}>
            Ocupação
          </Text>
          <Text size="xs" fw={700}>
            {soldPct}%
          </Text>
        </Group>
        <Progress value={soldPct} radius="xl" size="sm" color="brand" />
      </Stack>
    </Box>
  );
}
