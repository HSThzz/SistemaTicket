/**
 * @file Lista de histórico administrativo — cards no mobile, tabela no desktop.
 */

import {
  Badge,
  Box,
  Group,
  Paper,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import type { AdminAuditLogEntry } from "../../types/api";
import { AUDIT_ACTION_LABELS } from "../../utils/adminRoles";

function formatAuditTarget(log: AdminAuditLogEntry): string {
  if (log.action === "USER_ROLE_UPDATED" && log.metadata?.email) {
    return String(log.metadata.email);
  }

  if (log.action === "ORDER_REFUNDED") {
    return `Pedido ${log.targetId.slice(0, 8)}…`;
  }

  if (log.action === "TICKETS_ISSUED_MANUALLY") {
    const email = log.metadata?.userEmail ? String(log.metadata.userEmail) : null;
    const qty = log.metadata?.quantity ? String(log.metadata.quantity) : null;
    if (email && qty) {
      return `${qty} ingresso(s) → ${email}`;
    }
    return `Pedido ${log.targetId.slice(0, 8)}…`;
  }

  return `${log.targetType}/${log.targetId.slice(0, 8)}…`;
}

function formatAuditWhen(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface AdminAuditLogListProps {
  logs: AdminAuditLogEntry[];
}

/**
 * Exibe o histórico de ações com layout adaptado ao viewport.
 */
export function AdminAuditLogList({ logs }: AdminAuditLogListProps) {
  const isMobile = useMediaQuery("(max-width: 47.99em)");

  if (isMobile) {
    return (
      <Stack gap="sm" className="admin-audit-cards">
        {logs.map((log) => (
          <Paper
            key={log.id}
            className="admin-audit-card"
            p="sm"
            radius="lg"
            withBorder
          >
            <Stack gap="xs">
              <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
                <Badge variant="light" color="grape" radius="sm" size="sm">
                  {AUDIT_ACTION_LABELS[log.action] ?? log.action}
                </Badge>
                <Text size="xs" c="dimmed" ta="right">
                  {formatAuditWhen(log.createdAt)}
                </Text>
              </Group>

              <Stack gap={2}>
                <Text size="sm" fw={600} lineClamp={1}>
                  {log.actorName ?? "Responsável"}
                </Text>
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {log.actorEmail ?? log.actorUserId}
                </Text>
              </Stack>

              <Text size="xs" c="dimmed" className="admin-mono-id">
                {formatAuditTarget(log)}
              </Text>
            </Stack>
          </Paper>
        ))}
      </Stack>
    );
  }

  return (
    <Box className="data-table-panel admin-audit-table">
      <Table.ScrollContainer minWidth={640}>
        <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Quando</Table.Th>
              <Table.Th>Ação</Table.Th>
              <Table.Th>Responsável</Table.Th>
              <Table.Th>Alvo</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {logs.map((log) => (
              <Table.Tr key={log.id}>
                <Table.Td>
                  <Text size="sm">{formatAuditWhen(log.createdAt)}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color="grape" radius="sm">
                    {AUDIT_ACTION_LABELS[log.action] ?? log.action}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Stack gap={0}>
                    <Text size="sm" fw={500}>
                      {log.actorName ?? "—"}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {log.actorEmail ?? log.actorUserId}
                    </Text>
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {formatAuditTarget(log)}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Box>
  );
}
