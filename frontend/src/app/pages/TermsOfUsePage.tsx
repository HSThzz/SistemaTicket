/**
 * @file Página pública dos Termos de Uso.
 * @module app/pages/TermsOfUsePage
 */

import { Container } from "@mantine/core";
import { LegalDocumentView } from "@/shared/legal/LegalDocumentView";
import { TERMS_OF_USE } from "@/shared/legal/documents";

export function TermsOfUsePage() {
  return (
    <Container size="md" py="xl">
      <LegalDocumentView document={TERMS_OF_USE} />
    </Container>
  );
}
