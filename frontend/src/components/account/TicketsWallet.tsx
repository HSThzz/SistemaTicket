import { useEffect, useRef, useState } from "react";
import { Box, Group, Text } from "@mantine/core";
import { IconChevronLeft, IconChevronRight, IconWallet } from "@tabler/icons-react";
import type { TicketListItem } from "@/shared/types/api";
import { TicketCardDetails } from "./TicketCardDetails";
import { TicketWalletPass } from "./TicketWalletPass";

interface TicketsWalletProps {
  tickets: TicketListItem[];
}

export function TicketsWallet({ tickets }: TicketsWalletProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    if (tickets.length === 0) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !tickets.some((ticket) => ticket.id === selectedId)) {
      setSelectedId(tickets[0].id);
    }
  }, [tickets, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      cardRefs.current.get(selectedId)?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedId, tickets]);

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedId) ?? tickets[0];
  const selectedIndex = tickets.findIndex((ticket) => ticket.id === selectedId);

  function selectPrevious() {
    if (tickets.length === 0) {
      return;
    }

    const currentIndex = tickets.findIndex((ticket) => ticket.id === selectedId);
    const nextIndex = currentIndex <= 0 ? tickets.length - 1 : currentIndex - 1;
    setSelectedId(tickets[nextIndex].id);
  }

  function selectNext() {
    if (tickets.length === 0) {
      return;
    }

    const currentIndex = tickets.findIndex((ticket) => ticket.id === selectedId);
    const nextIndex = currentIndex >= tickets.length - 1 ? 0 : currentIndex + 1;
    setSelectedId(tickets[nextIndex].id);
  }

  if (tickets.length === 0 || !selectedTicket) {
    return null;
  }

  return (
    <Box className="tickets-wallet">
      <Group justify="space-between" align="center" mb="md" className="tickets-wallet-toolbar">
        <Group gap={8}>
          <IconWallet size={18} style={{ opacity: 0.7 }} />
          <Text size="sm" c="dimmed" fw={600}>
            {tickets.length} {tickets.length === 1 ? "ingresso" : "ingressos"} na carteira
          </Text>
        </Group>

        {tickets.length > 1 ? (
          <Group gap={4}>
            <button
              type="button"
              className="tickets-wallet-nav-btn"
              onClick={selectPrevious}
              aria-label="Ingresso anterior"
            >
              <IconChevronLeft size={18} />
            </button>
            <Text size="xs" c="dimmed" fw={600} className="tickets-wallet-counter">
              {selectedIndex + 1} / {tickets.length}
            </Text>
            <button
              type="button"
              className="tickets-wallet-nav-btn"
              onClick={selectNext}
              aria-label="Próximo ingresso"
            >
              <IconChevronRight size={18} />
            </button>
          </Group>
        ) : null}
      </Group>

      <Box className="tickets-wallet-carousel">
        {tickets.map((ticket) => (
          <Box
            key={ticket.id}
            ref={(element) => {
              if (element) {
                cardRefs.current.set(ticket.id, element);
              } else {
                cardRefs.current.delete(ticket.id);
              }
            }}
            className="tickets-wallet-carousel-item"
          >
            <TicketWalletPass
              ticket={ticket}
              isSelected={ticket.id === selectedId}
              onSelect={() => setSelectedId(ticket.id)}
            />
          </Box>
        ))}
      </Box>

      {tickets.length > 1 ? (
        <Text size="xs" c="dimmed" ta="center" mt="md" className="tickets-wallet-hint">
          Deslize horizontalmente ou use as setas para trocar de ingresso
        </Text>
      ) : null}

      <Box className="tickets-wallet-detail">
        <TicketCardDetails ticket={selectedTicket} />
      </Box>
    </Box>
  );
}
