import { Box, Button, Group, Stack, Text, Title } from "@mantine/core";
import { IconBrandSpotify } from "@tabler/icons-react";
import { ZeMascot } from "../brand/ZeMascot";

export function EventsPromoBanner() {
  return (
    <Box className="events-promo-banner">
      <Group justify="space-between" align="center" wrap="wrap" gap="xl">
        <Stack gap="sm" maw={420}>
          <Title order={3} className="events-promo-title">
            Shows dos artistas que você curte
          </Title>
          <Text className="events-promo-sub" size="sm">
            Conecte seu Spotify e a VIBRA descobre seus artistas antes de todo mundo.
          </Text>
          <Group gap="sm" mt="xs">
            <Button
              variant="white"
              color="dark"
              radius="xl"
              leftSection={<IconBrandSpotify size={18} />}
              className="events-promo-btn"
            >
              Spotify
            </Button>
            <Button variant="outline" color="gray" radius="xl" className="events-promo-btn-outline">
              Em breve
            </Button>
          </Group>
        </Stack>

        <Box visibleFrom="sm" className="events-promo-mascot">
          <ZeMascot size={100} animated={false} variant="light" />
        </Box>
      </Group>
    </Box>
  );
}
