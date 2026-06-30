import { Box, Text } from "@mantine/core";
import { IconBrandSpotify, IconTicket } from "@tabler/icons-react";

export type PhoneScreen = "checkout" | "spotify" | "feed" | "dashboard";

type PhoneMockupProps = {
  screen: PhoneScreen;
  className?: string;
};

const ARTISTS = ["Jão", "Luísa Sonza", "Matuê"] as const;

export function PhoneMockup({ screen, className }: PhoneMockupProps) {
  return (
    <Box className={["landing-phone", className ?? ""].filter(Boolean).join(" ")}>
      <Box className="landing-phone-frame">
        <Box className="landing-phone-notch" aria-hidden="true" />
        <Box className={`landing-phone-screen landing-phone-screen--${screen}`}>
          {screen === "checkout" ? <CheckoutScreen /> : null}
          {screen === "spotify" ? <SpotifyScreen /> : null}
          {screen === "feed" ? <FeedScreen /> : null}
          {screen === "dashboard" ? <DashboardScreen /> : null}
        </Box>
      </Box>
    </Box>
  );
}

function CheckoutScreen() {
  return (
    <>
      <Box className="landing-phone-hero-img" />
      <Text className="landing-phone-label">Boiler Room · SP</Text>
      <Text className="landing-phone-title">Sexta, 23h</Text>
      <Box className="landing-phone-cta">Comprar ingresso</Box>
    </>
  );
}

function SpotifyScreen() {
  return (
    <>
      <Box className="landing-phone-spotify-head">
        <IconBrandSpotify size={14} />
        <Text size="xs" fw={700}>
          Do seu streaming
        </Text>
      </Box>
      <Box className="landing-phone-artists">
        {ARTISTS.map((name) => (
          <Box key={name} className="landing-phone-artist">
            <span className="landing-phone-artist-avatar" />
            <Text size="xs" fw={600}>
              {name}
            </Text>
            <span className="landing-phone-follow">Seguir</span>
          </Box>
        ))}
      </Box>
      <Box className="landing-phone-hero-img landing-phone-hero-img--sm" />
    </>
  );
}

function FeedScreen() {
  return (
    <>
      <Box className="landing-phone-feed-post">
        <span className="landing-phone-artist-avatar" />
        <Box className="landing-phone-feed-lines">
          <span />
          <span />
        </Box>
      </Box>
      <Box className="landing-phone-feed-img" />
      <Box className="landing-phone-feed-actions">
        <span />
        <span />
        <span />
      </Box>
    </>
  );
}

function DashboardScreen() {
  return (
    <>
      <Text className="landing-phone-label">Dashboard · ao vivo</Text>
      <Box className="landing-phone-stat-row">
        <Box className="landing-phone-mini-stat">
          <Text className="landing-phone-mini-value">847</Text>
          <Text size="xs" c="dimmed">
            vendidos
          </Text>
        </Box>
        <Box className="landing-phone-mini-stat">
          <Text className="landing-phone-mini-value">8%</Text>
          <Text size="xs" c="dimmed">
            taxa
          </Text>
        </Box>
      </Box>
      <Box className="landing-phone-chart">
        <span style={{ height: "40%" }} />
        <span style={{ height: "70%" }} />
        <span style={{ height: "55%" }} />
        <span style={{ height: "90%" }} />
        <span style={{ height: "65%" }} />
      </Box>
      <Box className="landing-phone-cta landing-phone-cta--outline">
        <IconTicket size={12} />
        Sacar D+3
      </Box>
    </>
  );
}
