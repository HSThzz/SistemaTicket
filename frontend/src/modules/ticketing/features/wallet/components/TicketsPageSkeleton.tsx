import { Box, Group, Skeleton, Stack } from "@mantine/core";

function WalletPassSkeleton() {
  return (
    <Box className="tickets-wallet-carousel-item">
      <Skeleton h={190} radius={18} className="skeleton-shimmer" />
    </Box>
  );
}

export function TicketsPageSkeleton() {
  return (
    <Stack gap="xl">
      <Stack gap="sm">
        <Skeleton h={36} w={280} radius="md" className="skeleton-shimmer" />
        <Skeleton h={20} w={360} radius="sm" className="skeleton-shimmer" />
      </Stack>

      <SimpleGridSkeleton />

      <Box className="tickets-wallet">
        <Group justify="space-between" mb="md">
          <Skeleton h={18} w={180} radius="sm" className="skeleton-shimmer" />
          <Skeleton h={32} w={96} radius="xl" className="skeleton-shimmer" />
        </Group>

        <Box className="tickets-wallet-carousel">
          <WalletPassSkeleton />
          <WalletPassSkeleton />
          <WalletPassSkeleton />
        </Box>

        <Box className="tickets-wallet-detail" mt="md">
          <Stack gap="sm">
            <Skeleton h={200} w={200} radius="md" mx="auto" className="skeleton-shimmer" />
            <Skeleton h={72} radius="md" className="skeleton-shimmer" />
            <Skeleton h={36} radius="xl" className="skeleton-shimmer" />
          </Stack>
        </Box>
      </Box>
    </Stack>
  );
}

function SimpleGridSkeleton() {
  return (
    <Group grow>
      <Skeleton h={88} radius="lg" className="skeleton-shimmer" />
      <Skeleton h={88} radius="lg" className="skeleton-shimmer" />
      <Skeleton h={88} radius="lg" className="skeleton-shimmer" />
    </Group>
  );
}
