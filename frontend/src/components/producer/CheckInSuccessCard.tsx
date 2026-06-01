import type { ReactNode } from "react";
import { Box, Group, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconCalendar, IconCheck, IconId, IconTicket } from "@tabler/icons-react";
import type { CheckInResult } from "../../features/ticketing/api/checkInService";
import { formatShortDate } from "../../utils/format";

interface CheckInSuccessCardProps {
  result: CheckInResult;
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Group gap="md" wrap="nowrap" align="flex-start">
      <ThemeIcon size={32} radius="md" variant="light" color="green">
        {icon}
      </ThemeIcon>
      <Stack gap={2} flex={1}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          {label}
        </Text>
        <Text fw={600} size="sm" style={{ lineHeight: 1.4 }}>
          {value}
        </Text>
      </Stack>
    </Group>
  );
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
        <DetailRow icon={<IconId size={16} />} label="Documento" value={result.owner_document} />
        <DetailRow icon={<IconTicket size={16} />} label="Evento" value={result.event_title} />
        <DetailRow
          icon={<IconCalendar size={16} />}
          label="Check-in"
          value={formatShortDate(result.checked_in_at)}
        />
      </Stack>
    </Box>
  );
}
