import { Grid, Group, Paper, SimpleGrid, Skeleton, Stack } from "@mantine/core";

function ProducerEventListRowSkeleton() {
  return (
    <Paper radius="lg" withBorder p="md" className="skeleton-shimmer producer-event-list-row">
      <Group wrap="nowrap" align="center" gap="md">
        <Skeleton w={56} h={56} radius="md" />
        <Stack gap="xs" flex={1}>
          <Skeleton h={18} w="30%" radius="sm" />
          <Skeleton h={22} w="60%" radius="sm" />
          <Skeleton h={14} w="80%" radius="sm" />
        </Stack>
        <Skeleton h={36} w={110} radius="xl" />
      </Group>
    </Paper>
  );
}

interface ProducerPanelSkeletonProps {
  variant?: "dashboard" | "events";
}

/** Skeleton do painel do produtor com layout por tipo de tela. */
export function ProducerPanelSkeleton({ variant = "dashboard" }: ProducerPanelSkeletonProps) {
  if (variant === "events") {
    return (
      <Stack gap="lg">
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} h={88} radius="lg" className="skeleton-shimmer" />
          ))}
        </SimpleGrid>

        <Stack gap="sm">
          <Skeleton h={24} w={220} radius="sm" className="skeleton-shimmer" />
          <Skeleton h={16} w={360} radius="sm" className="skeleton-shimmer" />
        </Stack>

        <Stack gap="sm">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProducerEventListRowSkeleton key={index} />
          ))}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="md">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} h={88} radius="lg" className="skeleton-shimmer" />
        ))}
      </SimpleGrid>

      <Skeleton h={72} radius="lg" className="skeleton-shimmer" />

      <Skeleton h={96} radius="lg" className="skeleton-shimmer" />

      <Grid gap="lg">
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Skeleton h={320} radius="lg" className="skeleton-shimmer" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Stack gap="md">
            <Skeleton h={200} radius="lg" className="skeleton-shimmer" />
            <Skeleton h={140} radius="lg" className="skeleton-shimmer" />
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
