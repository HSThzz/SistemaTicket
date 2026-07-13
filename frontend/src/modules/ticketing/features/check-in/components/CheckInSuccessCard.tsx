import type { ReactNode } from "react";
import { Box, Button, Group, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import {
  IconCalendar,
  IconCheck,
  IconId,
  IconTicket,
  IconX,
} from "@tabler/icons-react";
import type {
  CheckInPreviewResult,
  CheckInResult,
} from "@/modules/ticketing/api/checkInService";
import { formatLotPrice, formatShortDate } from "@/shared/utils/format";

function DetailRow({
  icon,
  label,
  value,
  emphasize,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <Group gap="md" wrap="nowrap" align="flex-start">
      <ThemeIcon
        size={32}
        radius="md"
        variant="light"
        color={emphasize ? "brand" : "gray"}
      >
        {icon}
      </ThemeIcon>
      <Stack gap={2} flex={1}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          {label}
        </Text>
        <Text
          fw={emphasize ? 800 : 600}
          size={emphasize ? "lg" : "sm"}
          c={emphasize ? "brand" : undefined}
          style={{ lineHeight: 1.4 }}
        >
          {value}
        </Text>
      </Stack>
    </Group>
  );
}

function LotBadge({ lotName, lotPrice }: { lotName: string; lotPrice: number }) {
  const isFree = lotPrice === 0;

  return (
    <Box
      className="checkin-lot-badge"
      p="md"
      style={{
        borderRadius: 12,
        background: isFree
          ? "var(--mantine-color-teal-light)"
          : "var(--mantine-color-brand-light)",
      }}
    >
      <Text size="xs" tt="uppercase" fw={700} c={isFree ? "teal" : "brand"} mb={4}>
        Tipo do ingresso
      </Text>
      <Text fw={800} size="xl" style={{ lineHeight: 1.2 }}>
        {lotName}
      </Text>
      <Text size="sm" fw={600} mt={4} c={isFree ? "teal" : "dimmed"}>
        {formatLotPrice(lotPrice)}
      </Text>
    </Box>
  );
}

interface CheckInPreviewCardProps {
  preview: CheckInPreviewResult;
  confirming: boolean;
  onConfirm: () => void;
  onReject: () => void;
}

/** Pré-visualização antes de liberar: lote em destaque + Liberar / Recusar. */
export function CheckInPreviewCard({
  preview,
  confirming,
  onConfirm,
  onReject,
}: CheckInPreviewCardProps) {
  return (
    <Box className="checkin-success-card checkin-preview-card">
      <Group gap="md" mb="lg" wrap="nowrap">
        <ThemeIcon size={48} radius="xl" variant="light" color="blue">
          <IconTicket size={26} stroke={2} />
        </ThemeIcon>
        <Stack gap={4}>
          <Text size="xs" c="blue" tt="uppercase" fw={700}>
            Conferir antes de liberar
          </Text>
          <Title order={3} size="h4" style={{ letterSpacing: "-0.01em" }}>
            {preview.owner_name}
          </Title>
        </Stack>
      </Group>

      <Stack gap="md">
        <LotBadge lotName={preview.lot_name} lotPrice={preview.lot_price} />
        <DetailRow
          icon={<IconId size={16} />}
          label="Documento"
          value={preview.owner_document}
        />
        <DetailRow
          icon={<IconTicket size={16} />}
          label="Evento"
          value={preview.event_title}
        />
      </Stack>

      <Group grow mt="xl" gap="sm">
        <Button
          variant="default"
          radius="xl"
          leftSection={<IconX size={18} />}
          disabled={confirming}
          onClick={onReject}
        >
          Recusar
        </Button>
        <Button
          radius="xl"
          color="green"
          leftSection={<IconCheck size={18} />}
          loading={confirming}
          onClick={onConfirm}
        >
          Liberar entrada
        </Button>
      </Group>
    </Box>
  );
}

interface CheckInSuccessCardProps {
  result: CheckInResult;
}

export function CheckInSuccessCard({ result }: CheckInSuccessCardProps) {
  return (
    <Box className="checkin-success-card">
      <Group gap="md" mb="lg" wrap="nowrap">
        <ThemeIcon size={48} radius="xl" variant="light" color="green">
          <IconCheck size={26} stroke={2} />
        </ThemeIcon>
        <Stack gap={4}>
          <Text size="xs" c="green" tt="uppercase" fw={700}>
            Entrada liberada
          </Text>
          <Title order={3} size="h4" style={{ letterSpacing: "-0.01em" }}>
            {result.owner_name}
          </Title>
        </Stack>
      </Group>

      <Stack gap="md">
        <LotBadge lotName={result.lot_name} lotPrice={result.lot_price} />
        <DetailRow
          icon={<IconId size={16} />}
          label="Documento"
          value={result.owner_document}
        />
        <DetailRow
          icon={<IconTicket size={16} />}
          label="Evento"
          value={result.event_title}
        />
        <DetailRow
          icon={<IconCalendar size={16} />}
          label="Check-in"
          value={formatShortDate(result.checked_in_at)}
        />
      </Stack>
    </Box>
  );
}
