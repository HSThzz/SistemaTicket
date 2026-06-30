/**
 * @file Controle segmentado para filtrar eventos por visibilidade (público/privado).
 * @module components/events/EventTypeFilterControl
 */

import { SegmentedControl } from "@mantine/core";
import {
  EVENT_TYPE_FILTER_LABELS,
  type EventTypeFilter,
} from "@/modules/catalog/utils/eventTypeFilter";

interface EventTypeFilterControlProps {
  value: EventTypeFilter;
  onChange: (value: EventTypeFilter) => void;
  counts?: Record<EventTypeFilter, number>;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
}

/**
 * SegmentedControl reutilizável com contadores opcionais por aba.
 */
export function EventTypeFilterControl({
  value,
  onChange,
  counts,
  className,
  size = "sm",
  fullWidth = false,
}: EventTypeFilterControlProps) {
  const data = (["all", "public", "private"] as const).map((filter) => ({
    value: filter,
    label: counts
      ? `${EVENT_TYPE_FILTER_LABELS[filter]} (${counts[filter]})`
      : EVENT_TYPE_FILTER_LABELS[filter],
  }));

  return (
    <SegmentedControl
      value={value}
      onChange={(next) => onChange(next as EventTypeFilter)}
      data={data}
      radius="xl"
      size={size}
      fullWidth={fullWidth}
      className={className}
    />
  );
}
