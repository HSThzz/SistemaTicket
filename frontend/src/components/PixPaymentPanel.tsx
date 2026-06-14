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
  Loader,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
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
const QR_RENDER_SIZE = 200;

export function PixPaymentPanel({
  pixCopyPaste,
  amountCents,
  expiresAt,
  showQrCode = true,
  compact = false,
}: PixPaymentPanelProps) {
  const qrSize = compact ? 168 : QR_RENDER_SIZE;

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
            <Box
              className={`pix-qr-slot${compact ? " pix-qr-slot--compact" : ""}`}
              p="md"
              bg="white"
              aria-label="QR Code PIX"
            >
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

/** Placeholder enquanto o pedido é persistido (evita layout shift). */
export function OrderProcessingPanel() {
  return (
    <PremiumPaper
      p="xl"
      className="pix-payment-panel pix-payment-panel--skeleton"
      aria-busy="true"
      aria-label="Preparando pedido"
    >
      <Stack gap="lg" align="center" py="xl">
        <Loader size="md" color="brand" />
        <Stack gap={4} align="center" ta="center">
          <Text fw={700}>Preparando seu pedido</Text>
          <Text size="sm" c="dimmed" style={{ lineHeight: 1.55 }}>
            Aguarde enquanto confirmamos sua reserva. Em seguida você poderá escolher a forma de
            pagamento.
          </Text>
        </Stack>
      </Stack>
    </PremiumPaper>
  );
}

/** Placeholder com dimensões fixas enquanto o PIX é gerado (evita layout shift). */
export function PixPaymentSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <PremiumPaper
      p={compact ? "lg" : "xl"}
      className="pix-payment-panel pix-payment-panel--skeleton"
      aria-busy="true"
      aria-label="Gerando pagamento PIX"
    >
      <Stack gap={compact ? "md" : "lg"}>
        <Group gap="sm" align="flex-start">
          <Skeleton height={compact ? 40 : 48} width={compact ? 40 : 48} radius="xl" />
          <Stack gap={6} style={{ flex: 1 }}>
            <Skeleton height={18} width="55%" radius="sm" />
            <Skeleton height={14} width="90%" radius="sm" />
            <Skeleton height={14} width="75%" radius="sm" />
          </Stack>
        </Group>

        <Center className="pix-qr-wrap">
          <Box className={`pix-qr-slot pix-qr-slot--loading${compact ? " pix-qr-slot--compact" : ""}`}>
            <Loader size="sm" color="brand" />
          </Box>
        </Center>

        <Group justify="space-between" wrap="wrap" gap="sm">
          <Skeleton height={42} width={120} radius="sm" />
          <Skeleton height={42} width={140} radius="sm" />
        </Group>

        <Stack gap="xs">
          <Skeleton height={12} width={100} radius="sm" />
          <Skeleton height={72} radius="md" />
        </Stack>

        <Skeleton height={44} radius="xl" />
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
