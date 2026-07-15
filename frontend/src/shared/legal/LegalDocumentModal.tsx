/**
 * @file Modal scrollável com Termos de Uso ou Política de Privacidade.
 * @module shared/legal/LegalDocumentModal
 */

import { Anchor, Modal, ScrollArea, Text } from "@mantine/core";
import { Link } from "react-router-dom";
import { getLegalDocument, type LegalDocumentId } from "./documents";
import { LegalDocumentView } from "./LegalDocumentView";

interface LegalDocumentModalProps {
  documentId: LegalDocumentId | null;
  onClose: () => void;
}

export function LegalDocumentModal({
  documentId,
  onClose,
}: LegalDocumentModalProps) {
  const document = documentId ? getLegalDocument(documentId) : null;

  return (
    <Modal
      opened={documentId !== null}
      onClose={onClose}
      title={document?.title}
      size="lg"
      radius="md"
      centered
      scrollAreaComponent={ScrollArea.Autosize}
    >
      {document ? (
        <>
          <LegalDocumentView document={document} showTitle={false} />
          <Text size="xs" c="dimmed" mt="lg">
            Também disponível em{" "}
            <Anchor component={Link} to={document.path} onClick={onClose} fw={600}>
              {document.path}
            </Anchor>
            .
          </Text>
        </>
      ) : null}
    </Modal>
  );
}
