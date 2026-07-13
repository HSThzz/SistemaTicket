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
import { PageBackNav } from "@/shared/components/PageBackNav";
import { PremiumPaper } from "@/shared/components/PremiumPaper";
import {
  CheckInPreviewCard,
  CheckInSuccessCard,
} from "@/modules/ticketing/features/check-in/components/CheckInSuccessCard";
import { ProducerNav } from "@/modules/catalog/features/producer/components/ProducerNav";
import { QrScanner } from "@/modules/ticketing/features/check-in/components/QrScanner";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import * as checkInService from "@/modules/ticketing/api/checkInService";
import { getApiErrorMessage } from "@/shared/utils/errors";

interface CheckInFormValues {
  checkInCode: string;
}

const CHECKIN_TIPS = [
  "Aponte a câmera para o QR Code — o sistema mostra o tipo do ingresso antes de liberar.",
  "Confira o lote (ex.: Feminino gratuito / Masculino) e o documento antes de tocar em Liberar.",
  "Se a câmera falhar, cole o código manualmente no campo ao lado.",
] as const;

/**
 * Valida ingressos via {@link QrScanner} ou código manual: preview → Liberar/Recusar.
 */
export function ProducerCheckInPage() {
  const [lookingUp, setLookingUp] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [preview, setPreview] = useState<checkInService.CheckInPreviewResult | null>(
    null,
  );
  const [lastResult, setLastResult] = useState<checkInService.CheckInResult | null>(
    null,
  );
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

  const busy = lookingUp || confirming || Boolean(preview);

  const performPreview = useCallback(
    async (rawCode: string) => {
      const checkInCode = rawCode.trim();
      if (checkInCode.replace(/[\s-]/g, "").length < 6 || lookingUp || confirming) {
        return;
      }

      if (preview) {
        return;
      }

      setLookingUp(true);
      setScannerLocked(true);
      setLastResult(null);

      try {
        const result = await checkInService.previewCheckIn(checkInCode);
        setPreview(result);
        setPendingCode(checkInCode);
        form.reset();
      } catch (error) {
        notifications.show({
          title: "Ingresso inválido",
          message: getApiErrorMessage(error),
          color: "red",
          icon: <IconX size={18} />,
        });
        window.setTimeout(() => setScannerLocked(false), 600);
      } finally {
        setLookingUp(false);
      }
    },
    [confirming, form, lookingUp, preview],
  );

  const handleConfirm = useCallback(async () => {
    if (!pendingCode || confirming) {
      return;
    }

    setConfirming(true);

    try {
      const result = await checkInService.checkInTicket(pendingCode);
      setLastResult(result);
      setPreview(null);
      setPendingCode(null);

      notifications.show({
        title: "Entrada liberada",
        message: `${result.owner_name} · ${result.lot_name}`,
        color: "green",
        icon: <IconCheck size={18} />,
      });
    } catch (error) {
      notifications.show({
        title: "Não foi possível liberar",
        message: getApiErrorMessage(error),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setConfirming(false);
      window.setTimeout(() => setScannerLocked(false), 600);
    }
  }, [confirming, pendingCode]);

  const handleReject = useCallback(() => {
    setPreview(null);
    setPendingCode(null);
    notifications.show({
      title: "Entrada recusada",
      message: "O ingresso não foi marcado como usado. Pode escanear o próximo.",
      color: "orange",
    });
    window.setTimeout(() => setScannerLocked(false), 400);
  }, []);

  const handleSubmit = form.onSubmit(async (values) => {
    await performPreview(values.checkInCode);
  });

  const handleScan = useCallback(
    (decodedText: string) => {
      void performPreview(decodedText);
    },
    [performPreview],
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
              Escaneie, confira o tipo do ingresso e só então libere a entrada.
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
                      {lookingUp
                        ? "Consultando ingresso..."
                        : preview
                          ? "Confira os dados ao lado / abaixo e libere ou recuse."
                          : "Aponte a câmera para o QR code na tela ou no ingresso"}
                    </Text>
                    <Box className="checkin-scanner-frame">
                      <QrScanner onScan={handleScan} locked={scannerLocked || busy} />
                    </Box>
                  </Stack>
                </PremiumPaper>

                {preview ? (
                  <CheckInPreviewCard
                    preview={preview}
                    confirming={confirming}
                    onConfirm={() => void handleConfirm()}
                    onReject={handleReject}
                  />
                ) : null}

                {lastResult && !preview ? (
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
                        Use quando a câmera não estiver disponível ou o QR estiver
                        danificado.
                      </Text>
                      <TextInput
                        label="Código do ingresso"
                        placeholder="Ex.: ABCD-EFGH"
                        leftSection={<IconScan size={18} />}
                        radius="md"
                        disabled={Boolean(preview)}
                        {...form.getInputProps("checkInCode")}
                      />
                      <Button
                        type="submit"
                        loading={lookingUp}
                        disabled={Boolean(preview)}
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
