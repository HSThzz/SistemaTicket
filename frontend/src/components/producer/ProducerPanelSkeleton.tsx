import { Group, Paper, SimpleGrid, Skeleton, Stack } from "@mantine/core";

function ProducerEventCardSkeleton() {
  return (
    <Paper radius="lg" withBorder p={0} className="skeleton-shimmer" style={{ overflow: "hidden" }}>
      <Group wrap="nowrap" align="stretch" gap={0} className="producer-event-card-skeleton">
        <Skeleton className="producer-event-card-skeleton-cover" radius={0} />
        <Stack gap="md" p="md" flex={1}>
          <Skeleton h={22} w="35%" radius="sm" />
          <Skeleton h={28} w="75%" radius="sm" />
          <Skeleton h={16} w="55%" radius="sm" />
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} h={72} radius="md" />
            ))}
          </SimpleGrid>
        </Stack>
      </Group>
    </Paper>
  );
}

/** Skeleton do painel do produtor (dashboard e lista de eventos). */
export function ProducerPanelSkeleton() {
  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} h={88} radius="lg" className="skeleton-shimmer" />
        ))}
      </SimpleGrid>

      <Stack gap="sm">
        <Skeleton h={24} w={220} radius="sm" className="skeleton-shimmer" />
        <Skeleton h={16} w={320} radius="sm" className="skeleton-shimmer" />
      </Stack>

      <Stack gap="md">
        {Array.from({ length: 3 }).map((_, index) => (
          <ProducerEventCardSkeleton key={index} />
        ))}
      </Stack>
    </Stack>
  );
}
