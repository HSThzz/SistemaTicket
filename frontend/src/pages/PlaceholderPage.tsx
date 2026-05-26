import { Paper, Text, Title } from "@mantine/core";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Paper p="xl" radius="md">
      <Title order={2} mb="sm">
        {title}
      </Title>
      {description ? <Text c="dimmed">{description}</Text> : null}
    </Paper>
  );
}
