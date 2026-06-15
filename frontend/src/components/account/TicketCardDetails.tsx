import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Anchor,
  Box,
  Button,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconCheck,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import { QRCodeSVG } from "qrcode.react";
import type { TicketListItem } from "../../types/api";
import { TicketWalletActions } from "../TicketWalletActions";
import { formatShortDate } from "../../utils/format";

interface TicketCardDetailsProps {
  ticket: TicketListItem;
}

export function TicketCardDetails({ ticket }: TicketCardDetailsProps) {
  const [showCode, setShowCode] = useState(false);
  const isActive = ticket.status === "ACTIVE";
  const isUsed = ticket.status === "USED";
  const eventHref = `/eventos/${ticket.event.id}`;

  return (
    <Stack gap="lg" className="ticket-wallet-pass-body">
      {isActive ? (
        <Group justify="center" py="xs">
          <Stack gap="sm" align="center">
            <Box className="ticket-qr-frame">
              <QRCodeSVG value={ticket.uniqueCode} size={200} level="Q" includeMargin={false} />
            </Box>
            <Text size="xs" c="dimmed" ta="center" maw={260}>
              Apresente este QR na entrada do evento
            </Text>
          </Stack>
        </Group>
      ) : null}

      {isActive ? <TicketWalletActions ticketId={ticket.id} /> : null}

      {isActive ? (
        <Button
          variant="subtle"
          color="gray"
          size="compact-sm"
          radius="xl"
          fullWidth
          className="ticket-code-toggle"
          rightSection={showCode ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
          onClick={() => setShowCode((value) => !value)}
        >
          {showCode ? "Ocultar código manual" : "Problema com o QR? Ver código manual"}
        </Button>
      ) : null}

      {isActive && showCode ? (
        <Box className="ticket-code-block">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={6}>
            Código do ingresso
          </Text>
          <Text ff="monospace" size="sm" fw={500} style={{ wordBreak: "break-all" }}>
            {ticket.uniqueCode}
          </Text>
        </Box>
      ) : null}

      {isUsed && ticket.checkedInAt ? (
        <Group gap="xs" c="blue">
          <IconCheck size={16} />
          <Text size="sm" fw={500}>
            Check-in em {formatShortDate(ticket.checkedInAt)}
          </Text>
        </Group>
      ) : null}

      {!isActive ? (
        <Button
          variant="subtle"
          color="gray"
          size="compact-sm"
          radius="xl"
          fullWidth
          className="ticket-code-toggle"
          rightSection={showCode ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
          onClick={() => setShowCode((value) => !value)}
        >
          {showCode ? "Ocultar código" : "Ver código do ingresso"}
        </Button>
      ) : null}

      {!isActive && showCode ? (
        <Box className="ticket-code-block">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={6}>
            Código do ingresso
          </Text>
          <Text ff="monospace" size="sm" fw={500} style={{ wordBreak: "break-all" }}>
            {ticket.uniqueCode}
          </Text>
        </Box>
      ) : null}

      <Anchor component={Link} to={eventHref} size="sm" fw={600}>
        Ver detalhes do evento →
      </Anchor>
    </Stack>
  );
}
