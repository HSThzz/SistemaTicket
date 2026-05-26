import { Group, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  valueColor?: string;
  iconColor?: string;
}

export function StatCard({ label, value, icon, valueColor, iconColor = "brand" }: StatCardProps) {
  return (
    <Paper radius="lg" p="md" className="stat-card">
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon size={40} radius="md" variant="light" color={iconColor}>
          {icon}
        </ThemeIcon>
        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {label}
          </Text>
          <Text className="stat-card-value" c={valueColor}>
            {value}
          </Text>
        </Stack>
      </Group>
    </Paper>
  );
}
