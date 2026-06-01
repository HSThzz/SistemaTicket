/**
 * @file Página genérica de “em breve” para rotas ainda não implementadas.
 * @module pages/PlaceholderPage
 */

import { Stack, Text } from "@mantine/core";
import { AnimatedSection } from "../components/home/AnimatedSection";
import { PageHeader } from "../components/account/PageHeader";
import { PremiumPaper } from "../components/account/PremiumPaper";

/** Título e descrição opcional da seção placeholder. */
interface PlaceholderPageProps {
  title: string;
  description?: string;
}

/**
 * Exibe cabeçalho e aviso de desenvolvimento para funcionalidades futuras.
 */
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Stack gap="lg">
      <AnimatedSection>
        <PageHeader
          title={title}
          description={description ?? "Esta seção estará disponível em breve."}
        />
      </AnimatedSection>
      <AnimatedSection delayMs={60}>
        <PremiumPaper p="xl">
          <Text c="dimmed">Em desenvolvimento.</Text>
        </PremiumPaper>
      </AnimatedSection>
    </Stack>
  );
}
