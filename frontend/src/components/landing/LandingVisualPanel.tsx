import { Box, Text } from "@mantine/core";
import { IconPlayerPlay } from "@tabler/icons-react";
import type { ReactNode } from "react";

type StatCard = {
  label: string;
  value: string;
  detail?: string;
};

type LandingVisualPanelProps =
  | {
      variant: "photo";
      label?: string;
      caption?: string;
      tone?: "concert" | "festival" | "crowd";
    }
  | {
      variant: "video";
      label?: string;
      duration?: string;
    }
  | {
      variant: "collage";
      label?: string;
    }
  | {
      variant: "social";
      label?: string;
      cards: StatCard[];
    }
  | {
      variant: "stats";
      items: StatCard[];
    }
  | {
      variant: "custom";
      children: ReactNode;
      className?: string;
    };

export function LandingVisualPanel(props: LandingVisualPanelProps) {
  if (props.variant === "custom") {
    return (
      <Box className={`landing-visual ${props.className ?? ""}`.trim()}>{props.children}</Box>
    );
  }

  if (props.variant === "stats") {
    return (
      <Box className="landing-visual landing-visual--stats">
        <Box className="landing-visual-stats-stack">
          {props.items.map((item) => (
            <Box key={item.label} className="landing-visual-stat-card">
              <Text className="landing-visual-stat-label">{item.label}</Text>
              <Text className="landing-visual-stat-value">{item.value}</Text>
              {item.detail ? (
                <Text className="landing-visual-stat-detail">{item.detail}</Text>
              ) : null}
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  if (props.variant === "social") {
    return (
      <Box className="landing-visual landing-visual--social">
        <Box className="landing-visual-social-bg" aria-hidden="true" />
        {props.label ? <Text className="landing-visual-badge">{props.label}</Text> : null}
        <Box className="landing-visual-social-cards">
          {props.cards.map((card) => (
            <Box key={card.label} className="landing-visual-social-card">
              <Text className="landing-visual-stat-label">{card.label}</Text>
              <Text className="landing-visual-stat-value">{card.value}</Text>
              {card.detail ? (
                <Text className="landing-visual-stat-detail">{card.detail}</Text>
              ) : null}
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  if (props.variant === "video") {
    return (
      <Box className="landing-visual landing-visual--video">
        <Box className="landing-visual-video-scrim" />
        <Box className="landing-visual-play" aria-hidden="true">
          <IconPlayerPlay size={28} stroke={1.5} fill="currentColor" />
        </Box>
        {props.label ? <Text className="landing-visual-badge">{props.label}</Text> : null}
        {props.duration ? (
          <Text className="landing-visual-duration">{props.duration}</Text>
        ) : null}
      </Box>
    );
  }

  if (props.variant === "collage") {
    return (
      <Box className="landing-visual landing-visual--collage">
        <Box className="landing-visual-collage-grid">
          <span className="landing-visual-collage-tile landing-visual-collage-tile--a" />
          <span className="landing-visual-collage-tile landing-visual-collage-tile--b" />
          <span className="landing-visual-collage-tile landing-visual-collage-tile--c" />
          <span className="landing-visual-collage-tile landing-visual-collage-tile--d" />
        </Box>
        {props.label ? <Text className="landing-visual-badge">{props.label}</Text> : null}
      </Box>
    );
  }

  const tone = props.tone ?? "concert";

  return (
    <Box className={`landing-visual landing-visual--photo landing-visual--${tone}`}>
      <Box className="landing-visual-photo-scrim" />
      {props.label ? <Text className="landing-visual-badge">{props.label}</Text> : null}
      {props.caption ? <Text className="landing-visual-caption">{props.caption}</Text> : null}
    </Box>
  );
}
