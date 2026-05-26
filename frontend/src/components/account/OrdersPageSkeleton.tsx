import { Grid, Group, Paper, Skeleton, Stack } from "@mantine/core";

function OrderCardSkeleton() {
  return (
    <Paper radius="lg" withBorder p={0} className="skeleton-shimmer" style={{ overflow: "hidden" }}>
      <Group wrap="nowrap" align="stretch" gap={0}>
        <Skeleton w={100} radius={0} />
        <Stack gap="md" p="lg" flex={1} style={{ paddingLeft: "var(--mantine-spacing-xl)" }}>
          <Skeleton h={20} w="40%" />
          <Skeleton h={28} w="55%" />
          <Skeleton h={36} w="35%" />
          <Skeleton h={56} radius="sm" />
          <Skeleton h={56} radius="sm" />
          <Skeleton h={16} w="50%" />
        </Stack>
      </Group>
    </Paper>
  );
}

export function OrdersPageSkeleton() {
  return (
    <Stack gap="xl">
      <Stack gap="sm">
        <Skeleton h={36} w={280} radius="md" className="skeleton-shimmer" />
        <Skeleton h={20} w={400} radius="sm" className="skeleton-shimmer" />
      </Stack>
      <Grid>
        <Grid.Col span={{ base: 6, sm: 4 }}>
          <Skeleton h={88} radius="lg" className="skeleton-shimmer" />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4 }}>
          <Skeleton h={88} radius="lg" className="skeleton-shimmer" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Skeleton h={88} radius="lg" className="skeleton-shimmer" />
        </Grid.Col>
      </Grid>
      <Grid>
        {Array.from({ length: 4 }).map((_, index) => (
          <Grid.Col key={index} span={{ base: 12, lg: 6 }}>
            <OrderCardSkeleton />
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  );
}
