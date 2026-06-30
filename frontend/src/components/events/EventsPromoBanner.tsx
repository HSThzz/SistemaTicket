import { Badge, Box, Button, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { IconBrandSpotify, IconLogin } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/identity/context/AuthContext";
import type { SpotifyStatus } from "@/modules/integrations/api/spotifyService";
import { ZeMascot } from "../brand/ZeMascot";

interface EventsPromoBannerProps {
  status: SpotifyStatus;
  loadingStatus: boolean;
  connecting: boolean;
  disconnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

function getBannerCopy(
  isAuthenticated: boolean,
  status: SpotifyStatus,
): { badge: string | null; badgeColor: string; message: string } {
  if (status.connected) {
    return {
      badge: "Conectado",
      badgeColor: "green",
      message: `Olá${status.displayName ? `, ${status.displayName}` : ""}! A VIBRA cruza seus artistas do Spotify com eventos publicados.`,
    };
  }

  if (!status.configured) {
    return {
      badge: "Em breve",
      badgeColor: "gray",
      message:
        "Em breve você poderá conectar o Spotify e receber sugestões de shows com base no que você mais ouve.",
    };
  }

  if (!isAuthenticated) {
    return {
      badge: null,
      badgeColor: "gray",
      message:
        "Entre na sua conta, conecte o Spotify e descubra eventos com base nos artistas que você mais ouve.",
    };
  }

  return {
    badge: null,
    badgeColor: "gray",
    message:
      "Conecte seu Spotify e a VIBRA sugere shows alinhados ao seu gosto musical.",
  };
}

export function EventsPromoBanner({
  status,
  loadingStatus,
  connecting,
  disconnecting,
  onConnect,
  onDisconnect,
}: EventsPromoBannerProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const copy = getBannerCopy(isAuthenticated, status);

  const handlePrimaryClick = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/eventos" } });
      return;
    }
    onConnect();
  };

  const showConnectButton = !status.connected && status.configured;
  const showLoginButton = !status.connected && status.configured && !isAuthenticated;
  const primaryLabel = showLoginButton ? "Entrar para conectar" : "Conectar Spotify";
  const primaryIcon = showLoginButton ? <IconLogin size={18} /> : <IconBrandSpotify size={18} />;

  return (
    <Box className="events-promo-banner">
      <Group justify="space-between" align="center" wrap="wrap" gap="lg">
        <Stack gap="sm" className="events-promo-copy">
          <Group gap="sm" align="center" wrap="wrap">
            <Title order={3} className="events-promo-title">
              Shows dos artistas que você curte
            </Title>
            {copy.badge ? (
              <Badge variant="light" color={copy.badgeColor} radius="sm">
                {copy.badge}
              </Badge>
            ) : null}
          </Group>

          <Text className="events-promo-sub" size="sm">
            {copy.message}
          </Text>

          <Group gap="sm" mt="xs" wrap="wrap">
            {loadingStatus ? <Loader size="sm" /> : null}

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

            {showConnectButton ? (
              <Button
                radius="xl"
                leftSection={primaryIcon}
                className="events-promo-btn-spotify"
                loading={connecting}
                onClick={handlePrimaryClick}
              >
                {primaryLabel}
              </Button>
            ) : null}

            {!status.connected && !status.configured && !loadingStatus ? (
              <Button
                radius="xl"
                variant="light"
                color="gray"
                disabled
                className="events-promo-btn-disabled"
              >
                Indisponível no momento
              </Button>
            ) : null}
          </Group>
        </Stack>

        <Box visibleFrom="sm" className="events-promo-mascot">
          <ZeMascot size={100} animated={false} variant="light" />
        </Box>
      </Group>
    </Box>
  );
}
