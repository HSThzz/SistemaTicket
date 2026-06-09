import { SimpleGrid, Text, UnstyledButton } from "@mantine/core";
import {
  IconBalloon,
  IconBuilding,
  IconDeviceDesktop,
  IconMicrophone2,
  IconSparkles,
} from "@tabler/icons-react";
import { CATEGORY_LABELS, type EventCategory } from "../../utils/eventVisuals";

const CATEGORIES: {
  value: EventCategory;
  icon: typeof IconSparkles;
}[] = [
  { value: "all", icon: IconSparkles },
  { value: "show", icon: IconMicrophone2 },
  { value: "festival", icon: IconBalloon },
  { value: "corporate", icon: IconBuilding },
  { value: "online", icon: IconDeviceDesktop },
];

interface EventsCategoryGridProps {
  value: EventCategory;
  onChange: (value: EventCategory) => void;
}

export function EventsCategoryGrid({ value, onChange }: EventsCategoryGridProps) {
  return (
    <SimpleGrid cols={{ base: 4, sm: 6, md: 8 }} spacing="sm" className="events-category-grid">
      {CATEGORIES.map((item) => {
        const Icon = item.icon;
        const isActive = value === item.value;

        return (
          <UnstyledButton
            key={item.value}
            className={`events-category-tile${isActive ? " events-category-tile--active" : ""}`}
            onClick={() => onChange(item.value)}
          >
            <Icon size={22} stroke={1.6} />
            <Text size="xs" fw={600} lineClamp={1}>
              {CATEGORY_LABELS[item.value]}
            </Text>
          </UnstyledButton>
        );
      })}
    </SimpleGrid>
  );
}
