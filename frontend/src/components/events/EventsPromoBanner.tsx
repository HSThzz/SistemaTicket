import { Badge, Box, Group, Stack, Text, Title, Tooltip } from "@mantine/core";
import { IconBrandSpotify } from "@tabler/icons-react";
import { ZeMascot } from "../brand/ZeMascot";

export function EventsPromoBanner() {
  return (
    <Box className="events-promo-banner">
      <Group justify="space-between" align="center" wrap="wrap" gap="xl">
        <Stack gap="sm" maw={420}>
          <Group gap="sm" align="center">
            <Title order={3} className="events-promo-title">
              Shows dos artistas que você curte
            </Title>
            <Badge variant="light" color="gray" radius="sm" className="events-promo-badge">
              Em breve
            </Badge>
          </Group>
          <Text className="events-promo-sub" size="sm">
            Em breve você poderá conectar o Spotify e a VIBRA vai sugerir eventos com base nos
            artistas que você mais ouve.
          </Text>
          <Group gap="sm" mt="xs">
            <Tooltip label="Integração com Spotify em desenvolvimento" withArrow>
              <Badge
                variant="outline"
                color="gray"
                size="lg"
                radius="xl"
                leftSection={<IconBrandSpotify size={16} />}
                className="events-promo-coming-soon"
              >
                Conectar Spotify
              </Badge>
            </Tooltip>
          </Group>
        </Stack>

        <Box visibleFrom="sm" className="events-promo-mascot">
          <ZeMascot size={100} animated={false} variant="light" />
        </Box>
      </Group>
    </Box>
  );
}
