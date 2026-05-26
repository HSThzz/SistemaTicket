import { Stack, Text } from "@mantine/core";
import { AnimatedSection } from "../components/home/AnimatedSection";
import { PageHeader } from "../components/account/PageHeader";
import { PremiumPaper } from "../components/account/PremiumPaper";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

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
