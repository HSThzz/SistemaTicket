/**
 * @file Seção padronizada do painel administrativo.
 */

import { Box, Group, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import type { ReactNode } from "react";
import type { TablerIcon } from "@tabler/icons-react";
import { PremiumPaper } from "../account/PremiumPaper";

interface AdminSectionProps {
  icon: TablerIcon;
  iconColor?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * Bloco com cabeçalho iconográfico e painel premium.
 */
export function AdminSection({
  icon: Icon,
  iconColor = "brand",
  title,
  description,
  action,
  children,
  className,
}: AdminSectionProps) {
  return (
    <PremiumPaper
      p={{ base: "md", sm: "xl" }}
      className={`admin-section${className ? ` ${className}` : ""}`}
    >
      <Group
        justify="space-between"
        align="flex-start"
        mb="lg"
        wrap="wrap"
        gap="md"
        className="admin-section-header"
      >
        <Group gap="sm" align="flex-start" wrap="nowrap" className="admin-section-heading">
          <ThemeIcon size={42} radius="md" variant="light" color={iconColor} className="admin-section-icon">
            <Icon size={22} />
          </ThemeIcon>
          <Stack gap={4} className="admin-section-copy">
            <Title order={3} size="h4" className="admin-section-title">
              {title}
            </Title>
            {description ? (
              <Text size="sm" c="dimmed">
                {description}
              </Text>
            ) : null}
          </Stack>
        </Group>
        {action ? <Box className="admin-section-action">{action}</Box> : null}
      </Group>
      {children}
    </PremiumPaper>
  );
}
