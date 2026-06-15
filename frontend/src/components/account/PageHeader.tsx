import { Group, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

interface PageHeaderProps {
  icon?: ReactNode;
  title: string;
  highlight?: string;
  description: string;
  action?: ReactNode;
}

export function PageHeader({ icon, title, highlight, description, action }: PageHeaderProps) {
  return (
    <div className="page-header">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
        <Stack gap="sm" maw={560}>
          <Group gap="xs" wrap="nowrap" align="flex-start">
            {icon}
            <Title order={1} className="page-title">
              {title}{" "}
              {highlight ? (
                <span className="page-title-highlight">{highlight}</span>
              ) : null}
            </Title>
          </Group>
          <Text c="dimmed" size="lg" className="page-header-description">
            {description}
          </Text>
        </Stack>
        {action}
      </Group>
    </div>
  );
}
