import { Box, ScrollArea, SimpleGrid, Text, UnstyledButton } from "@mantine/core";
import {
  IconBalloon,
  IconBuilding,
  IconDeviceDesktop,
  IconMicrophone2,
  IconSparkles,
} from "@tabler/icons-react";
import { CATEGORY_LABELS, type EventCategory } from "@/modules/catalog/utils/eventVisuals";

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
  variant?: "grid" | "drawer";
}

function CategoryTile({
  value,
  icon: Icon,
  isActive,
  onChange,
}: {
  value: EventCategory;
  icon: typeof IconSparkles;
  isActive: boolean;
  onChange: (value: EventCategory) => void;
}) {
  return (
    <UnstyledButton
      className={`events-category-tile${isActive ? " events-category-tile--active" : ""}`}
      onClick={() => onChange(value)}
    >
      <Icon size={22} stroke={1.6} />
      <Text size="xs" fw={600} lineClamp={2} ta="center">
        {CATEGORY_LABELS[value]}
      </Text>
    </UnstyledButton>
  );
}

export function EventsCategoryGrid({
  value,
  onChange,
  variant = "grid",
}: EventsCategoryGridProps) {
  if (variant === "drawer") {
    return (
      <SimpleGrid cols={{ base: 2 }} spacing="sm">
        {CATEGORIES.map((item) => (
          <CategoryTile
            key={item.value}
            value={item.value}
            icon={item.icon}
            isActive={value === item.value}
            onChange={onChange}
          />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <>
      <ScrollArea
        type="scroll"
        offsetScrollbars
        className="events-category-scroll"
        hiddenFrom="sm"
      >
        <Box className="events-category-track">
          {CATEGORIES.map((item) => (
            <Box key={item.value} className="events-category-track-item">
              <CategoryTile
                value={item.value}
                icon={item.icon}
                isActive={value === item.value}
                onChange={onChange}
              />
            </Box>
          ))}
        </Box>
      </ScrollArea>

      <SimpleGrid
        cols={{ base: 4, sm: 6, md: 8 }}
        spacing="sm"
        className="events-category-grid"
        visibleFrom="sm"
      >
        {CATEGORIES.map((item) => (
          <CategoryTile
            key={item.value}
            value={item.value}
            icon={item.icon}
            isActive={value === item.value}
            onChange={onChange}
          />
        ))}
      </SimpleGrid>
    </>
  );
}
