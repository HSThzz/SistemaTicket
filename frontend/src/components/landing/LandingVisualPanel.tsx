import { Box, Text } from "@mantine/core";
import type { ReactNode } from "react";

type SocialCard = {
  label: string;
  value: string;
  detail?: string;
};

type LandingVisualPanelProps =
  | {
      variant: "social";
      label?: string;
      cards: SocialCard[];
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
