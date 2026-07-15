/**
 * @file Renderização tipográfica de um documento legal.
 * @module shared/legal/LegalDocumentView
 */

import { Stack, Table, Text, Title } from "@mantine/core";
import {
  LEGAL_DOCUMENTS_UPDATED_AT,
  LEGAL_DOCUMENTS_VERSION,
  type LegalDocument,
} from "./documents";

interface LegalDocumentViewProps {
  document: LegalDocument;
  /** Título principal da página (omitir no modal, que já tem header). */
  showTitle?: boolean;
}

export function LegalDocumentView({
  document,
  showTitle = true,
}: LegalDocumentViewProps) {
  return (
    <Stack gap="lg">
      {showTitle ? (
        <Stack gap={4}>
          <Title order={1} className="page-title">
            {document.title}
          </Title>
          <Text size="sm" c="dimmed">
            Versão {LEGAL_DOCUMENTS_VERSION} · Atualizado em{" "}
            {LEGAL_DOCUMENTS_UPDATED_AT}
          </Text>
        </Stack>
      ) : (
        <Text size="sm" c="dimmed">
          Versão {LEGAL_DOCUMENTS_VERSION} · Atualizado em{" "}
          {LEGAL_DOCUMENTS_UPDATED_AT}
        </Text>
      )}

      <Text size="sm" lh={1.6}>
        {document.intro}
      </Text>

      {document.sections.map((section) => (
        <Stack key={section.title} gap="xs">
          <Title order={3} size="h4">
            {section.title}
          </Title>
          {section.paragraphs.map((paragraph) => (
            <Text key={paragraph.slice(0, 48)} size="sm" lh={1.6}>
              {paragraph}
            </Text>
          ))}
          {section.table ? (
            <Table
              withTableBorder
              withColumnBorders
              striped
              highlightOnHover={false}
              verticalSpacing="sm"
              horizontalSpacing="md"
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{section.table.headers[0]}</Table.Th>
                  <Table.Th>{section.table.headers[1]}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {section.table.rows.map(([col1, col2]) => (
                  <Table.Tr key={col1}>
                    <Table.Td>
                      <Text size="sm" fw={600}>
                        {col1}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{col2}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : null}
        </Stack>
      ))}
    </Stack>
  );
}
