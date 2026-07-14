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
import { IconTicket, IconTrash } from "@tabler/icons-react";
import { LotStockBadge } from "@/components/ui/LotStockBadge";
import type { TicketLot } from "@/shared/types/api";
import { formatLotPrice } from "@/shared/utils/format";

interface ProducerLotCardProps {
  lot: TicketLot;
  canDelete?: boolean;
  deleting?: boolean;
  onDelete?: (lot: TicketLot) => void;
}

export function ProducerLotCard({
  lot,
  canDelete = false,
  deleting = false,
  onDelete,
}: ProducerLotCardProps) {
  const sold = lot.totalQuantity - lot.availableQuantity;
  const soldPct = lot.totalQuantity > 0 ? Math.round((sold / lot.totalQuantity) * 100) : 0;

  return (
    <Box className="producer-lot-card">
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
        <Group gap="md" wrap="nowrap" align="flex-start">
          <ThemeIcon size={44} radius="md" variant="light" color="brand">
            <IconTicket size={22} />
          </ThemeIcon>
          <Stack gap={6}>
            <Title order={4} style={{ letterSpacing: "-0.01em" }}>
              {lot.name}
            </Title>
            <Text fw={800} size="xl" c="brand" className="producer-metric-value">
              {formatLotPrice(lot.price)}
            </Text>
          </Stack>
        </Group>
        <Group gap="sm" wrap="nowrap">
          <LotStockBadge availableQuantity={lot.availableQuantity} />
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
      </Group>

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
