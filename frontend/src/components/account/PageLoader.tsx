import { Center, Loader, Stack, Text } from "@mantine/core";

export function PageLoader({ label = "Carregando..." }: { label?: string }) {
  return (
    <Center py={80}>
      <Stack align="center" gap="md">
        <Loader color="brand" size="lg" type="dots" />
        <Text size="sm" c="dimmed">
          {label}
        </Text>
      </Stack>
    </Center>
  );
}
