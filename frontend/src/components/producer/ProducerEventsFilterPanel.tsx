/**
 * @file Painel de filtros da listagem de eventos do produtor.
 * @module components/producer/ProducerEventsFilterPanel
 */

import { Chip, Group, ScrollArea, SimpleGrid, Stack, Text, UnstyledButton } from "@mantine/core";
import { IconFileText, IconLock, IconX } from "@tabler/icons-react";
import { PremiumPaper } from "../account/PremiumPaper";
import {
  EVENT_TYPE_FILTER_LABELS,
  type EventTypeFilter,
} from "@/modules/catalog/utils/eventTypeFilter";

export type ProducerEventStatusFilter = "all" | "published" | "draft";

const STATUS_LABELS: Record<ProducerEventStatusFilter, string> = {
  all: "Todos",
  published: "Publicados",
  draft: "Rascunhos",
};

interface FilterChipRowProps<T extends string> {
  label: string;
  icon: typeof IconFileText;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  counts: Record<T, number>;
  onChange: (value: T) => void;
}

function FilterChipRow<T extends string>({
  label,
  icon: Icon,
  value,
  options,
  labels,
  counts,
  onChange,
}: FilterChipRowProps<T>) {
  return (
    <Stack gap="xs" className="producer-events-filter-row">
      <Text size="xs" fw={700} c="dimmed" tt="uppercase" className="producer-events-filter-row__label">
        <Icon size={14} stroke={1.8} />
        {label}
      </Text>
      <ScrollArea type="never" offsetScrollbars>
        <Chip.Group value={value} onChange={(next) => onChange(next as T)}>
          <Group gap="xs" wrap="nowrap" pb={2}>
            {options.map((option) => (
              <Chip
                key={option}
                value={option}
                variant={value === option ? "filled" : "outline"}
                color="brand"
                radius="xl"
                size="sm"
                classNames={{ root: "producer-events-filter-chip" }}
              >
                {labels[option]} ({counts[option]})
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </ScrollArea>
    </Stack>
  );
}

interface ProducerEventsFilterPanelProps {
  statusFilter: ProducerEventStatusFilter;
  onStatusFilterChange: (value: ProducerEventStatusFilter) => void;
  statusCounts: Record<ProducerEventStatusFilter, number>;
  typeFilter: EventTypeFilter;
  onTypeFilterChange: (value: EventTypeFilter) => void;
  typeCounts: Record<EventTypeFilter, number>;
  onClearFilters?: () => void;
  showClearFilters?: boolean;
}

/**
 * Agrupa filtros de status e acesso em um único painel com chips rotulados.
 */
export function ProducerEventsFilterPanel({
  statusFilter,
  onStatusFilterChange,
  statusCounts,
  typeFilter,
  onTypeFilterChange,
  typeCounts,
  onClearFilters,
  showClearFilters = false,
}: ProducerEventsFilterPanelProps) {
  return (
    <PremiumPaper p="md" className="producer-events-filter-panel">
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          <FilterChipRow
            label="Status"
            icon={IconFileText}
            value={statusFilter}
            options={["all", "published", "draft"] as const}
            labels={STATUS_LABELS}
            counts={statusCounts}
            onChange={onStatusFilterChange}
          />
          <FilterChipRow
            label="Acesso"
            icon={IconLock}
            value={typeFilter}
            options={["all", "public", "private"] as const}
            labels={EVENT_TYPE_FILTER_LABELS}
            counts={typeCounts}
            onChange={onTypeFilterChange}
          />
        </SimpleGrid>

        {showClearFilters && onClearFilters ? (
          <Group justify="flex-end">
            <UnstyledButton className="producer-events-filter-clear" onClick={onClearFilters}>
              <IconX size={14} />
              Limpar filtros
            </UnstyledButton>
          </Group>
        ) : null}
      </Stack>
    </PremiumPaper>
  );
}
