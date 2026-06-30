import {
  Box,
  Group,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconTicket } from "@tabler/icons-react";
import { LotStockBadge } from "@/components/ui/LotStockBadge";
import type { TicketLot } from "@/shared/types/api";
import { formatCurrencyFromCents } from "@/shared/utils/format";

interface ProducerLotCardProps {
  lot: TicketLot;
}

export function ProducerLotCard({ lot }: ProducerLotCardProps) {
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
              {formatCurrencyFromCents(lot.price)}
            </Text>
          </Stack>
        </Group>
        <LotStockBadge availableQuantity={lot.availableQuantity} />
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
