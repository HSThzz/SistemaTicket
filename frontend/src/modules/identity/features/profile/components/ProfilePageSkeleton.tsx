import { Box, Group, Skeleton, Stack } from "@mantine/core";

export function ProfilePageSkeleton() {
  return (
    <Stack gap="xl">
      <Stack gap="sm">
        <Skeleton h={36} w={280} radius="md" className="skeleton-shimmer" />
        <Skeleton h={20} w={360} radius="sm" className="skeleton-shimmer" />
      </Stack>

      <Group gap="sm">
        <Skeleton h={36} w={96} radius="xl" className="skeleton-shimmer" />
        <Skeleton h={36} w={112} radius="xl" className="skeleton-shimmer" />
        <Skeleton h={36} w={88} radius="xl" className="skeleton-shimmer" />
      </Group>

      <Box className="premium-panel" p="lg">
        <Stack gap="md">
          <Skeleton h={40} radius="md" className="skeleton-shimmer" />
          <Skeleton h={40} radius="md" className="skeleton-shimmer" />
          <Skeleton h={40} radius="md" className="skeleton-shimmer" />
          <Skeleton h={42} w={160} radius="xl" className="skeleton-shimmer" />
        </Stack>
      </Box>
    </Stack>
  );
}
