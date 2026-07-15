import { Badge, Box, Button, Group, Stack, Text, Title, Tooltip } from "@mantine/core";
import { IconBrandSpotify } from "@tabler/icons-react";
import type { SpotifyStatus } from "@/modules/integrations/api/spotifyService";
import { ZeMascot } from "@/modules/leads/features/contact/components/ZeMascot";

interface EventsPromoBannerProps {
  status: SpotifyStatus;
  loadingStatus: boolean;
  connecting: boolean;
  disconnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

/**
 * Banner de promoção Spotify. O botão de conectar fica desabilitado
 * enquanto a integração estiver em desenvolvimento.
 */
export function EventsPromoBanner({
  status,
  disconnecting,
  onDisconnect,
}: EventsPromoBannerProps) {
  return (
    <Box className="events-promo-banner">
      <Group justify="space-between" align="center" wrap="wrap" gap="lg">
        <Stack gap="sm" className="events-promo-copy">
          <Group gap="sm" align="center" wrap="wrap">
            <Title order={3} className="events-promo-title">
              Shows dos artistas que você curte
            </Title>
            <Badge variant="light" color="gray" radius="sm">
              Em desenvolvimento
            </Badge>
            {status.connected ? (
              <Badge variant="light" color="green" radius="sm">
                Conectado
              </Badge>
            ) : null}
          </Group>

          <Text className="events-promo-sub" size="sm">
            Em breve você poderá conectar o Spotify e receber sugestões de shows com base no que
            você mais ouve.
          </Text>

          <Group gap="sm" mt="xs" wrap="wrap">
            {status.connected ? (
              <Button
                variant="outline"
                color="gray"
                radius="xl"
                loading={disconnecting}
                onClick={onDisconnect}
              >
                Desconectar
              </Button>
            ) : null}

            <Tooltip label="Em desenvolvimento" withArrow position="top">
              <Box component="span" display="inline-block">
                <Button
                  radius="xl"
                  leftSection={<IconBrandSpotify size={18} />}
                  className="events-promo-btn-spotify"
                  disabled
                >
                  Conectar Spotify
                </Button>
              </Box>
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
