import { Center, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Center py={48} className="empty-state-card" style={{ borderRadius: "var(--mantine-radius-xl)" }}>
      <Stack align="center" gap="md" maw={400} ta="center" px="lg">
        <ThemeIcon size={64} radius="xl" variant="light" color="brand">
          {icon}
        </ThemeIcon>
        <Stack gap={4}>
          <Title order={3} size="h4">
            {title}
          </Title>
          <Text c="dimmed" size="sm">
            {description}
          </Text>
        </Stack>
        {action}
      </Stack>
    </Center>
  );
}
