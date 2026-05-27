import { Chip, Group, ScrollArea, Stack, Text } from "@mantine/core";
import {
  CATEGORY_LABELS,
  type EventCategory,
} from "../../utils/eventVisuals";

const CATEGORIES: EventCategory[] = ["all", "festival", "show", "corporate", "online"];

interface CategoryPillsProps {
  value: EventCategory;
  onChange: (value: EventCategory) => void;
}

export function CategoryPills({ value, onChange }: CategoryPillsProps) {
  return (
    <Stack gap="sm">
      <Text size="sm" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: "0.04em" }}>
        Explorar por categoria
      </Text>
      <ScrollArea type="never" offsetScrollbars>
        <Chip.Group value={value} onChange={(next) => onChange(next as EventCategory)}>
          <Group gap="sm" wrap="nowrap" pb={4}>
            {CATEGORIES.map((category) => (
              <Chip
                key={category}
                value={category}
                variant={value === category ? "filled" : "outline"}
                color="brand"
                radius="xl"
                size="md"
                classNames={{ label: "category-pill" }}
              >
                {CATEGORY_LABELS[category]}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </ScrollArea>
    </Stack>
  );
}
