import type { ReactNode } from "react";
import { Group, Menu, UnstyledButton } from "@mantine/core";
import {
  IconCalendar,
  IconChevronDown,
  IconCurrencyReal,
  IconMapPin,
} from "@tabler/icons-react";

export type EventsDateFilter = "all" | "soon";
export type EventsPriceFilter = "all" | "free" | "paid";

interface EventsFilterBarProps {
  cities: string[];
  city: string | "all";
  onCityChange: (city: string | "all") => void;
  dateFilter: EventsDateFilter;
  onDateFilterChange: (value: EventsDateFilter) => void;
  priceFilter: EventsPriceFilter;
  onPriceFilterChange: (value: EventsPriceFilter) => void;
}

const DATE_LABELS: Record<EventsDateFilter, string> = {
  all: "Data",
  soon: "Esta semana",
};

const PRICE_LABELS: Record<EventsPriceFilter, string> = {
  all: "Preço",
  free: "Gratuito",
  paid: "Pago",
};

function FilterPill({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <UnstyledButton
      className={`events-filter-pill${active ? " events-filter-pill--active" : ""}`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
      <IconChevronDown size={14} stroke={1.8} />
    </UnstyledButton>
  );
}

export function EventsFilterBar({
  cities,
  city,
  onCityChange,
  dateFilter,
  onDateFilterChange,
  priceFilter,
  onPriceFilterChange,
}: EventsFilterBarProps) {
  const cityLabel = city === "all" ? "Todos" : city.toUpperCase();

  return (
    <Group gap="sm" wrap="wrap" className="events-filter-bar">
      <Menu withinPortal position="bottom-start" shadow="md">
        <Menu.Target>
          <div>
            <FilterPill
              icon={<IconMapPin size={16} stroke={1.8} />}
              label={cityLabel}
              active={city !== "all"}
            />
          </div>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={() => onCityChange("all")}>Todas as cidades</Menu.Item>
          {cities.map((item) => (
            <Menu.Item key={item} onClick={() => onCityChange(item)}>
              {item}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>

      <Menu withinPortal position="bottom-start" shadow="md">
        <Menu.Target>
          <div>
            <FilterPill
              icon={<IconCalendar size={16} stroke={1.8} />}
              label={DATE_LABELS[dateFilter]}
              active={dateFilter !== "all"}
            />
          </div>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={() => onDateFilterChange("all")}>Qualquer data</Menu.Item>
          <Menu.Item onClick={() => onDateFilterChange("soon")}>Esta semana</Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <Menu withinPortal position="bottom-start" shadow="md">
        <Menu.Target>
          <div>
            <FilterPill
              icon={<IconCurrencyReal size={16} stroke={1.8} />}
              label={PRICE_LABELS[priceFilter]}
              active={priceFilter !== "all"}
            />
          </div>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={() => onPriceFilterChange("all")}>Qualquer preço</Menu.Item>
          <Menu.Item onClick={() => onPriceFilterChange("free")}>Gratuito</Menu.Item>
          <Menu.Item onClick={() => onPriceFilterChange("paid")}>Pago</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
