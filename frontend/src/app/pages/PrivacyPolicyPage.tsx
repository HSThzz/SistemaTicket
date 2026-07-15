/**
 * @file Página pública da Política de Privacidade.
 * @module app/pages/PrivacyPolicyPage
 */

import { Container } from "@mantine/core";
import { LegalDocumentView } from "@/shared/legal/LegalDocumentView";
import { PRIVACY_POLICY } from "@/shared/legal/documents";

export function PrivacyPolicyPage() {
  return (
    <Container size="md" py="xl">
      <LegalDocumentView document={PRIVACY_POLICY} />
    </Container>
  );
}
