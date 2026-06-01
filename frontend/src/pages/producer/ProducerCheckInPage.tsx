import { useCallback, useState } from "react";
import {
  Badge,
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
import { AnimatedSection } from "../../components/home/AnimatedSection";
import { BackButton } from "../../components/account/BackButton";
import { PremiumPaper } from "../../components/account/PremiumPaper";
import { CheckInSuccessCard } from "../../components/producer/CheckInSuccessCard";
import { QrScanner } from "../../components/QrScanner";
import * as checkInService from "../../features/ticketing/api/checkInService";
import { getApiErrorMessage } from "../../utils/errors";

interface CheckInFormValues {
  uniqueCode: string;
}

const CHECKIN_TIPS = [
  "Aponte a câmera para o QR Code na tela ou no ingresso impresso.",
  "Aguarde o beep visual — o check-in é automático após a leitura.",
  "Se a câmera falhar, cole o código manualmente no campo ao lado.",
] as const;

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
    <Stack gap={0}>
      <Box className="producer-checkin-hero producer-manage-hero full-bleed">
        <Box className="producer-manage-hero-overlay" />
        <Container size="lg" px="md" className="producer-manage-hero-content">
          <Stack gap="md">
            <BackButton to="/produtor" label="Voltar ao painel" inverted style={{ alignSelf: "flex-start" }} />
            <Stack gap="sm" maw={640}>
              <Group gap="sm" wrap="wrap">
                <Badge color="green" variant="filled" radius="sm">
                  Portaria
                </Badge>
                <Badge color="white" c="dark" variant="filled" radius="sm" leftSection={<IconQrcode size={12} />}>
                  QR Code
                </Badge>
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
          </Stack>
        </Container>
      </Box>

      <Container size="lg" py="xl" px="md">
        <Grid>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Stack gap="md">
              <AnimatedSection delayMs={60}>
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
                        : scannerPaused
                          ? "Scanner pausado — aguarde um instante"
                          : "Posicione o QR Code dentro da área destacada"}
                    </Text>
                    <Box className="checkin-scanner-frame">
                      <QrScanner onScan={handleScan} paused={scannerPaused || submitting} />
                    </Box>
                  </Stack>
                </PremiumPaper>
              </AnimatedSection>

              {lastResult ? (
                <AnimatedSection delayMs={100}>
                  <CheckInSuccessCard result={lastResult} />
                </AnimatedSection>
              ) : null}
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="md">
              <AnimatedSection delayMs={80}>
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
                        placeholder="Cole o código completo"
                        leftSection={<IconScan size={18} />}
                        radius="md"
                        {...form.getInputProps("uniqueCode")}
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
              </AnimatedSection>

              <AnimatedSection delayMs={120}>
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
              </AnimatedSection>
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </Stack>
  );
}
