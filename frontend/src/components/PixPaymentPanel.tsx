/**
 * @file Painel de pagamento PIX com QR Code, copia-e-cola e simulação em dev.
 * @module components/PixPaymentPanel
 */

import {
  Box,
  Button,
  Center,
  CopyButton,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconBolt, IconCheck, IconCopy, IconQrcode } from "@tabler/icons-react";
import { QRCodeSVG } from "qrcode.react";
import { PremiumPaper } from "./account/PremiumPaper";
import { formatCurrencyFromCents, formatEventDateOnly, formatEventTimeOnly } from "../utils/format";

/** Propriedades do painel PIX no checkout ou em pedidos pendentes. */
interface PixPaymentPanelProps {
  /** Código PIX copia e cola (payload do QR). */
  pixCopyPaste: string;
  /** Valor em centavos. */
  amountCents: number;
  /** Data/hora de expiração ISO. */
  expiresAt: string;
  /** Exibe QR Code SVG; `false` apenas copia-e-cola. */
  showQrCode?: boolean;
  /** Layout reduzido para mobile ou cards estreitos. */
  compact?: boolean;
}

/**
 * UI de pagamento PIX com valor, validade, QR opcional e botão copiar.
 */
export function PixPaymentPanel({
  pixCopyPaste,
  amountCents,
  expiresAt,
  showQrCode = true,
  compact = false,
}: PixPaymentPanelProps) {
  const isMobile = useMediaQuery("(max-width: 48em)");
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 360;
  const qrSize =
    isMobile === true
      ? Math.min(220, Math.max(160, viewportWidth - 80))
      : compact
        ? 168
        : 200;

  return (
    <PremiumPaper p={compact ? "lg" : "xl"} className="pix-payment-panel">
      <Stack gap={compact ? "md" : "lg"}>
        <Group gap="sm" align="flex-start">
          <ThemeIcon size={compact ? 40 : 48} radius="xl" variant="light" color="teal">
            <IconQrcode size={compact ? 20 : 24} />
          </ThemeIcon>
          <Stack gap={4}>
            <Text fw={700} size={compact ? "md" : "lg"}>
              Pague com PIX
            </Text>
            <Text c="dimmed" size="sm" style={{ lineHeight: 1.55 }}>
              {showQrCode
                ? "Escaneie o QR Code ou copie o código no app do seu banco."
                : "Copie o código abaixo e conclua o pagamento no app do seu banco."}
            </Text>
          </Stack>
        </Group>

        {showQrCode ? (
          <Center className="pix-qr-wrap">
            <Box className="pix-qr-box" p="md" bg="white" aria-label="QR Code PIX">
              <QRCodeSVG value={pixCopyPaste} size={qrSize} level="M" className="pix-qr-svg" />
            </Box>
          </Center>
        ) : null}

        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Stack gap={2}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Valor a pagar
            </Text>
            <Text className="order-total-value" c="brand">
              {formatCurrencyFromCents(amountCents)}
            </Text>
          </Stack>
          <Stack gap={2} ta="right">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Expira em
            </Text>
            <Text fw={600}>
              {formatEventDateOnly(expiresAt)} · {formatEventTimeOnly(expiresAt)}
            </Text>
          </Stack>
        </Group>

        <Stack gap="xs">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            Pix Copia e Cola
          </Text>
          <Box className="pix-code-block">
            <Text ff="monospace" size="sm" style={{ wordBreak: "break-all", lineHeight: 1.6 }}>
              {pixCopyPaste}
            </Text>
          </Box>
        </Stack>

        <CopyButton value={pixCopyPaste} timeout={2500}>
          {({ copied, copy }) => (
            <Button
              fullWidth
              radius="xl"
              variant={copied ? "light" : "filled"}
              color={copied ? "green" : "brand"}
              leftSection={copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
              onClick={copy}
              style={{ touchAction: "manipulation" }}
            >
              {copied ? "Código copiado" : "Copiar código PIX"}
            </Button>
          )}
        </CopyButton>

        <Text size="sm" c="dimmed" ta="center" style={{ lineHeight: 1.55 }}>
          Após o pagamento, a confirmação pode levar alguns segundos. Esta página atualiza automaticamente.
        </Text>
      </Stack>
    </PremiumPaper>
  );
}

/** Painel de simulação de pagamento apenas em ambiente de desenvolvimento. */
interface DevSimulatePaymentPanelProps {
  /** Indica requisição de simulação em andamento. */
  loading: boolean;
  /** Callback ao confirmar simulação de PIX pago. */
  onSimulate: () => void;
}

/**
 * Botão para simular confirmação PIX via endpoint de desenvolvimento.
 */
export function DevSimulatePaymentPanel({ loading, onSimulate }: DevSimulatePaymentPanelProps) {
  return (
    <PremiumPaper p="lg" className="checkout-dev-panel">
      <Stack gap="md">
        <Group gap="sm" align="flex-start">
          <ThemeIcon size={40} radius="md" variant="light" color="yellow">
            <IconBolt size={20} />
          </ThemeIcon>
          <Stack gap={4}>
            <Text fw={700}>Simular pagamento (dev)</Text>
            <Text size="sm" c="dimmed" style={{ lineHeight: 1.55 }}>
              Ambiente de desenvolvimento: confirma o PIX instantaneamente sem usar um banco real.
            </Text>
          </Stack>
        </Group>
        <Button
          variant="light"
          color="teal"
          radius="xl"
          loading={loading}
          leftSection={<IconBolt size={18} />}
          onClick={onSimulate}
        >
          Simular pagamento PIX
        </Button>
      </Stack>
    </PremiumPaper>
  );
}
