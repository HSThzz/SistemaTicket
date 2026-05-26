import { Grid, Group, Paper, Skeleton, Stack } from "@mantine/core";

function TicketCardSkeleton() {
  return (
    <Paper radius="lg" withBorder p={0} className="skeleton-shimmer" style={{ overflow: "hidden" }}>
      <Group wrap="nowrap" align="stretch" gap={0}>
        <Skeleton w={88} radius={0} />
        <Stack gap="sm" p="md" flex={1}>
          <Skeleton h={20} w="70%" />
          <Skeleton h={14} w="50%" />
          <Skeleton h={14} w="60%" />
          <Skeleton h={120} radius="md" mt="xs" />
          <Skeleton h={32} radius="sm" />
        </Stack>
      </Group>
    </Paper>
  );
}

export function TicketsPageSkeleton() {
  return (
    <Stack gap="xl">
      <Stack gap="sm">
        <Skeleton h={36} w={280} radius="md" className="skeleton-shimmer" />
        <Skeleton h={20} w={360} radius="sm" className="skeleton-shimmer" />
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
            <TicketCardSkeleton />
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  );
}
