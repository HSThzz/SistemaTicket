import { Box, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

type LandingShowcaseProps = {
  flip?: boolean;
  visualBleed?: boolean;
  kicker?: string;
  title: ReactNode;
  titleClassName?: string;
  body?: ReactNode;
  footer?: ReactNode;
  visual: ReactNode;
  className?: string;
};

export function LandingShowcase({
  flip = false,
  visualBleed = false,
  kicker,
  title,
  titleClassName,
  body,
  footer,
  visual,
  className,
}: LandingShowcaseProps) {
  const sectionClass = [
    "landing-showcase",
    flip ? "landing-showcase--flip" : "",
    visualBleed ? "landing-showcase--bleed" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const titleClass = ["landing-section-title", titleClassName ?? ""].filter(Boolean).join(" ");

  return (
    <Box className={sectionClass}>
      <Stack gap="lg" className="landing-showcase-copy">
        {kicker ? <Text className="vibra-kicker">{kicker}</Text> : null}
        <Title order={2} className={titleClass}>
          {title}
        </Title>
        {body ? (
          <Box className="landing-showcase-body">
            {typeof body === "string" ? (
              <Text c="dimmed" size="lg">
                {body}
              </Text>
            ) : (
              body
            )}
          </Box>
        ) : null}
        {footer}
      </Stack>

      <Box className="landing-showcase-visual">{visual}</Box>
    </Box>
  );
}
