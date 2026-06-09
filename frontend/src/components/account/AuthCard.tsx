import { Paper, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  highlight?: string;
  description: string;
  children: ReactNode;
}

export function AuthCard({ title, highlight, description, children }: AuthCardProps) {
  return (
    <div className="auth-page">
      <Paper className="auth-card premium-panel" p="xl" maw={480} w="100%" mx="auto">
        <Stack gap="xl">
          <Stack gap="sm">
            <Title order={1} className="page-title">
              {title}{" "}
              {highlight ? (
                <Text span inherit c="brand.7">
                  {highlight}
                </Text>
              ) : null}
            </Title>
            <Text c="dimmed" size="md">
              {description}
            </Text>
          </Stack>
          {children}
        </Stack>
      </Paper>
    </div>
  );
}
