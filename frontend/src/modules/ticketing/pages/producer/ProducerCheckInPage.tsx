/**
 * @file Página de check-in na entrada com scanner QR e código manual.
 * @module pages/producer/ProducerCheckInPage
 */

import { useCallback, useState } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  Group,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconKeyboard,
  IconQrcode,
  IconScan,
  IconX,
} from "@tabler/icons-react";
import { PageBackNav } from "@/components/account/PageBackNav";
import { PremiumPaper } from "@/components/account/PremiumPaper";
import { CheckInSuccessCard } from "@/components/producer/CheckInSuccessCard";
import { ProducerNav } from "@/components/producer/ProducerNav";
import { QrScanner } from "@/components/tickets/QrScanner";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import * as checkInService from "@/modules/ticketing/api/checkInService";
import { getApiErrorMessage } from "@/shared/utils/errors";

interface CheckInFormValues {
  checkInCode: string;
}

const CHECKIN_TIPS = [
  "Aponte a câmera para o QR Code na tela ou no ingresso impresso — não precisa encaixar perfeito.",
  "Aproxime ou afaste um pouco se a leitura demorar; brilho alto na tela ajuda.",
  "Se a câmera falhar, cole o código manualmente no campo ao lado.",
] as const;

/**
 * Valida ingressos via {@link QrScanner} ou campo de código único; exibe sucesso do check-in.
 */
export function ProducerCheckInPage() {
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<checkInService.CheckInResult | null>(null);
  const [scannerLocked, setScannerLocked] = useState(false);

  const form = useForm<CheckInFormValues>({
    initialValues: { checkInCode: "" },
    validate: {
      checkInCode: (value) => {
        const compact = value.trim().replace(/[\s-]/g, "");
        if (compact.length >= 6) {
          return null;
        }
        return "Informe o código do ingresso (ex.: ABCD-EFGH)";
      },
    },
  });

  const performCheckIn = useCallback(
    async (rawCode: string) => {
      const checkInCode = rawCode.trim();
      if (checkInCode.replace(/[\s-]/g, "").length < 6 || submitting) {
        return;
      }

      setSubmitting(true);
      setScannerLocked(true);

      try {
        const result = await checkInService.checkInTicket(checkInCode);
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
        window.setTimeout(() => setScannerLocked(false), 600);
      }
    },
    [form, submitting],
  );

  const handleSubmit = form.onSubmit(async (values) => {
    await performCheckIn(values.checkInCode);
  });

  const handleScan = useCallback(
    (decodedText: string) => {
      void performCheckIn(decodedText);
    },
    [performCheckIn],
  );

  return (
    <Stack gap={0}>
      <Box className="producer-checkin-hero producer-manage-hero full-bleed">
        <Box className="producer-manage-hero-overlay" />
        <Container size="lg" px="md" className="producer-manage-hero-content">
          <Stack gap="sm" maw={640}>
              <Group gap="sm" wrap="wrap">
                <PremiumBadge tone="published" size="sm" overlay dot pulseDot>
                  Portaria
                </PremiumBadge>
                <PremiumBadge
                  tone="glass"
                  size="sm"
                  overlay
                  icon={<IconQrcode size={12} stroke={2} />}
                >
                  QR Code
                </PremiumBadge>
              </Group>
              <Title
                order={1}
                style={{
                  fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                }}
              >
                Check-in na portaria
              </Title>
              <Text size="md" c="white" opacity={0.9} maw={520}>
                Escaneie o ingresso ou digite o código para validar a entrada em segundos.
              </Text>
            </Stack>
        </Container>
      </Box>

      <Box className="page-body">
        <Container size="lg" py="xl" px="md">
          <Stack gap="md">
            <PageBackNav to="/produtor" label="Voltar ao painel" />
            <ProducerNav showCreateEvent={false} />
          </Stack>
          <Grid mt="lg">
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Stack gap="md">
              <PremiumPaper p="xl">
                  <Stack gap="lg">
                    <Group gap="sm" className="producer-form-section-title">
                      <ThemeIcon size={36} radius="md" variant="light" color="blue">
                        <IconScan size={18} />
                      </ThemeIcon>
                      <Title order={3} size="h4" className="producer-section-title">
                        Scanner de câmera
                      </Title>
                    </Group>
                    <Text c="dimmed" size="sm">
                      {submitting
                        ? "Validando ingresso..."
                        : "Aponte a câmera para o QR code na tela ou no ingresso"}
                    </Text>
                    <Box className="checkin-scanner-frame">
                      <QrScanner onScan={handleScan} locked={scannerLocked || submitting} />
                    </Box>
                  </Stack>
                </PremiumPaper>

              {lastResult ? (
                <CheckInSuccessCard result={lastResult} />
              ) : null}
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="md">
              <PremiumPaper p="xl">
                <form onSubmit={handleSubmit}>
                    <Stack gap="lg">
                      <Group gap="sm" className="producer-form-section-title">
                        <ThemeIcon size={36} radius="md" variant="light" color="brand">
                          <IconKeyboard size={18} />
                        </ThemeIcon>
                        <Title order={3} size="h4" className="producer-section-title">
                          Código manual
                        </Title>
                      </Group>
                      <Text c="dimmed" size="sm">
                        Use quando a câmera não estiver disponível ou o QR estiver danificado.
                      </Text>
                      <TextInput
                        label="Código do ingresso"
                        placeholder="Ex.: ABCD-EFGH"
                        leftSection={<IconScan size={18} />}
                        radius="md"
                        {...form.getInputProps("checkInCode")}
                      />
                      <Button
                        type="submit"
                        loading={submitting}
                        fullWidth
                        radius="xl"
                        size="md"
                        leftSection={<IconCheck size={18} />}
                      >
                        Validar ingresso
                      </Button>
                    </Stack>
                  </form>
                </PremiumPaper>

              <PremiumPaper p="lg">
                  <Stack gap="md">
                    <Text fw={600} size="sm">
                      Dicas rápidas
                    </Text>
                    <Stack gap="md">
                      {CHECKIN_TIPS.map((tip) => (
                        <Box key={tip} className="checkin-tip-item">
                          <ThemeIcon size={24} radius="xl" variant="light" color="blue">
                            <IconQrcode size={14} />
                          </ThemeIcon>
                          <Text size="sm" c="dimmed" style={{ lineHeight: 1.55 }}>
                            {tip}
                          </Text>
                        </Box>
                      ))}
                    </Stack>
                  </Stack>
                </PremiumPaper>
            </Stack>
          </Grid.Col>
        </Grid>
        </Container>
      </Box>
    </Stack>
  );
}
