import { Box, Text } from "@mantine/core";
import type { TablerIcon } from "@tabler/icons-react";

export type FeatureListItem = {
  icon: TablerIcon;
  title: string;
  description?: string;
};

type LandingFeatureListProps = {
  items: FeatureListItem[];
  activeIndex?: number;
};

export function LandingFeatureList({ items }: LandingFeatureListProps) {
  return (
    <Box className="landing-feature-list" role="list">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Box
            key={item.title}
            className="landing-feature-list-item is-active"
            role="listitem"
          >
            <Icon size={20} stroke={1.5} className="landing-feature-list-icon" />
            <Box>
              <Text className="landing-feature-list-title">{item.title}</Text>
              {item.description ? (
                <Text size="sm" c="dimmed" className="landing-feature-list-desc">
                  {item.description}
                </Text>
              ) : null}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
