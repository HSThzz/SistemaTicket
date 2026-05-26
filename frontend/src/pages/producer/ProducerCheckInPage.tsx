import { useCallback, useState } from "react";
import { Alert, Button, Divider, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconScan, IconX } from "@tabler/icons-react";
import { AnimatedSection } from "../../components/home/AnimatedSection";
import { BackButton } from "../../components/account/BackButton";
import { PageHeader } from "../../components/account/PageHeader";
import { PremiumPaper } from "../../components/account/PremiumPaper";
import { QrScanner } from "../../components/QrScanner";
import * as checkInService from "../../services/checkInService";
import { formatShortDate } from "../../utils/format";
import { getApiErrorMessage } from "../../utils/errors";

interface CheckInFormValues {
  uniqueCode: string;
}

export function ProducerCheckInPage() {
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<checkInService.CheckInResult | null>(null);
  const [scannerPaused, setScannerPaused] = useState(false);

  const form = useForm<CheckInFormValues>({
    initialValues: { uniqueCode: "" },
    validate: {
      uniqueCode: (value) => (value.trim().length >= 8 ? null : "Informe o código do ingresso"),
    },
  });

  const performCheckIn = useCallback(
    async (rawCode: string) => {
      const uniqueCode = rawCode.trim();
      if (uniqueCode.length < 8 || submitting) {
        return;
      }

      setSubmitting(true);
      setScannerPaused(true);

      try {
        const result = await checkInService.checkInTicket(uniqueCode);
        setLastResult(result);
        form.reset();

        notifications.show({
          title: "Check-in realizado",
          message: `${result.owner_name} — ${result.event_title}`,
          color: "green",
          icon: <IconCheck size={18} />,
        });
      } catch (error) {
        notifications.show({
          title: "Check-in recusado",
          message: getApiErrorMessage(error),
          color: "red",
          icon: <IconX size={18} />,
        });
      } finally {
        setSubmitting(false);
        window.setTimeout(() => setScannerPaused(false), 2000);
      }
    },
    [form, submitting],
  );

  const handleSubmit = form.onSubmit(async (values) => {
    await performCheckIn(values.uniqueCode);
  });

  const handleScan = useCallback(
    (decodedText: string) => {
      void performCheckIn(decodedText);
    },
    [performCheckIn],
  );

  return (
    <Stack gap="lg" maw={640}>
      <BackButton to="/produtor" label="Voltar ao painel" />

      <AnimatedSection>
        <PageHeader
          icon={<IconScan size={28} color="var(--mantine-color-brand-6)" />}
          title="Check-in na"
          highlight="portaria"
          description="Escaneie o QR code do ingresso ou digite o código manualmente para validar a entrada."
        />
      </AnimatedSection>

      <AnimatedSection delayMs={60}>
        <PremiumPaper p="xl">
          <Stack gap="md">
            <Text fw={600} size="lg">
              Scanner de câmera
            </Text>
            <QrScanner onScan={handleScan} paused={scannerPaused || submitting} />
          </Stack>
        </PremiumPaper>
      </AnimatedSection>

      <Divider label="ou digite o código" labelPosition="center" />

      <AnimatedSection delayMs={100}>
        <PremiumPaper p="xl">
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="Código do ingresso"
                placeholder="Cole o código manualmente"
                leftSection={<IconScan size={18} />}
                radius="md"
                {...form.getInputProps("uniqueCode")}
              />
              <Button type="submit" loading={submitting} fullWidth radius="xl" size="md">
                Validar ingresso
              </Button>
            </Stack>
          </form>
        </PremiumPaper>
      </AnimatedSection>

      {lastResult ? (
        <AnimatedSection delayMs={120}>
          <Alert color="green" title="Último check-in confirmado" radius="lg">
            <Stack gap={4}>
              <Text fw={600}>{lastResult.owner_name}</Text>
              <Text size="sm">Documento: {lastResult.owner_document}</Text>
              <Text size="sm">Evento: {lastResult.event_title}</Text>
              <Text size="sm">Horário: {formatShortDate(lastResult.checked_in_at)}</Text>
            </Stack>
          </Alert>
        </AnimatedSection>
      ) : null}
    </Stack>
  );
}
