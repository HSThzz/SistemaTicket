import { Paper, Stack, Text, Title } from "@mantine/core";

export function HomePage() {
  return (
    <Paper p="xl" radius="md">
      <Stack gap="sm">
        <Title order={1}>Descubra eventos</Title>
        <Text c="dimmed" size="lg">
          Plataforma de ingressos — explore eventos publicados e garanta sua vaga.
        </Text>
      </Stack>
    </Paper>
  );
}
