import type { ReactNode } from "react";
import { DateTimePicker } from "@mantine/dates";
import { IconCalendar } from "@tabler/icons-react";

interface EventDateTimeFieldProps {
  label?: string;
  value: Date | null;
  onChange: (value: Date | null) => void;
  error?: ReactNode;
  disabled?: boolean;
  minDate?: Date;
  description?: string;
}

/**
 * Seletor de data e hora do evento — calendário visual integrado ao Mantine.
 */
export function EventDateTimeField({
  label = "Data e hora",
  value,
  onChange,
  error,
  disabled = false,
  minDate,
  description,
}: EventDateTimeFieldProps) {
  return (
    <DateTimePicker
      label={label}
      description={description}
      placeholder="Selecione data e hora"
      value={value}
      onChange={(nextValue) => {
        if (nextValue == null) {
          onChange(null);
          return;
        }

        const parsed = new Date(nextValue);
        onChange(Number.isNaN(parsed.getTime()) ? null : parsed);
      }}
      error={error}
      disabled={disabled}
      minDate={minDate}
      radius="md"
      clearable
      leftSection={<IconCalendar size={16} />}
      valueFormat="DD MMM YYYY, HH:mm"
      defaultTimeValue="20:00"
      popoverProps={{ withinPortal: true }}
    />
  );
}
