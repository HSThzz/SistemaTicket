import type { ReactNode } from "react";
import { Button, Group, Menu, UnstyledButton } from "@mantine/core";
import {
  IconArrowsSort,
  IconCalendar,
  IconChevronDown,
  IconCurrencyReal,
  IconLock,
  IconMapPin,
  IconTicket,
  IconX,
} from "@tabler/icons-react";
import type { EventsSort } from "../../utils/eventVisuals";
import { SORT_LABELS } from "../../utils/eventVisuals";
import {
  EVENT_TYPE_FILTER_LABELS,
  type EventTypeFilter,
} from "../../utils/eventTypeFilter";

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
  sort: EventsSort;
  onSortChange: (value: EventsSort) => void;
  hideSoldOut: boolean;
  onHideSoldOutChange: (value: boolean) => void;
  typeFilter: EventTypeFilter;
  onTypeFilterChange: (value: EventTypeFilter) => void;
  showClearFilters?: boolean;
  onClearFilters?: () => void;
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
  showChevron = true,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  showChevron?: boolean;
}) {
  return (
    <UnstyledButton
      className={`events-filter-pill${active ? " events-filter-pill--active" : ""}`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
      {showChevron ? <IconChevronDown size={14} stroke={1.8} /> : null}
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
  sort,
  onSortChange,
  hideSoldOut,
  onHideSoldOutChange,
  typeFilter,
  onTypeFilterChange,
  showClearFilters,
  onClearFilters,
}: EventsFilterBarProps) {
  const cityLabel = city === "all" ? "Todos" : city.toUpperCase();

  return (
    <Group gap="sm" wrap="wrap" className="events-filter-bar" justify="space-between">
      <Group gap="sm" wrap="wrap">
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

        <Menu withinPortal position="bottom-start" shadow="md">
          <Menu.Target>
            <div>
              <FilterPill
                icon={<IconLock size={16} stroke={1.8} />}
                label={
                  typeFilter === "all"
                    ? "Acesso"
                    : EVENT_TYPE_FILTER_LABELS[typeFilter]
                }
                active={typeFilter !== "all"}
              />
            </div>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={() => onTypeFilterChange("all")}>Todos</Menu.Item>
            <Menu.Item onClick={() => onTypeFilterChange("public")}>Públicos</Menu.Item>
            <Menu.Item onClick={() => onTypeFilterChange("private")}>Privados</Menu.Item>
          </Menu.Dropdown>
        </Menu>

        <Menu withinPortal position="bottom-start" shadow="md">
          <Menu.Target>
            <div>
              <FilterPill
                icon={<IconArrowsSort size={16} stroke={1.8} />}
                label={sort === "date" ? "Ordenar" : SORT_LABELS[sort]}
                active={sort !== "date"}
              />
            </div>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={() => onSortChange("date")}>Data</Menu.Item>
            <Menu.Item onClick={() => onSortChange("price_asc")}>Menor preço</Menu.Item>
            <Menu.Item onClick={() => onSortChange("price_desc")}>Maior preço</Menu.Item>
          </Menu.Dropdown>
        </Menu>

        <FilterPill
          icon={<IconTicket size={16} stroke={1.8} />}
          label="Com ingressos"
          active={hideSoldOut}
          showChevron={false}
          onClick={() => onHideSoldOutChange(!hideSoldOut)}
        />
      </Group>

      {showClearFilters && onClearFilters ? (
        <Button
          variant="subtle"
          color="gray"
          size="compact-sm"
          leftSection={<IconX size={14} />}
          onClick={onClearFilters}
          className="events-clear-filters-btn"
        >
          Limpar filtros
        </Button>
      ) : null}
    </Group>
  );
}
