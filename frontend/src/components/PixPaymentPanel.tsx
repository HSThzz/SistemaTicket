import { CopyButton, Group, Paper, Stack, Text, Textarea, Tooltip } from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { formatCurrencyFromCents, formatShortDate } from "../utils/format";

interface PixPaymentPanelProps {
  pixCopyPaste: string;
  amountCents: number;
  expiresAt: string;
}

export function PixPaymentPanel({ pixCopyPaste, amountCents, expiresAt }: PixPaymentPanelProps) {
  return (
    <Paper p="lg" radius="md" withBorder>
      <Stack gap="md">
        <Stack gap={4}>
          <Text fw={600} size="lg">
            Pague com PIX
          </Text>
          <Text c="dimmed" size="sm">
            Valor: {formatCurrencyFromCents(amountCents)} · Expira em{" "}
            {formatShortDate(expiresAt)}
          </Text>
        </Stack>

        <Textarea
          label="Pix Copia e Cola"
          value={pixCopyPaste}
          readOnly
          minRows={4}
          autosize
        />

        <Group>
          <CopyButton value={pixCopyPaste}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? "Copiado!" : "Copiar código PIX"} withArrow>
                <Group
                  gap="xs"
                  style={{ cursor: "pointer" }}
                  onClick={copy}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      copy();
                    }
                  }}
                >
                  {copied ? <IconCheck size={18} color="green" /> : <IconCopy size={18} />}
                  <Text fw={500} c={copied ? "green" : "brand"}>
                    {copied ? "Código copiado" : "Copiar código PIX"}
                  </Text>
                </Group>
              </Tooltip>
            )}
          </CopyButton>
        </Group>

        <Text size="sm" c="dimmed">
          Após o pagamento, a confirmação pode levar alguns segundos. Esta página atualiza
          automaticamente.
        </Text>
      </Stack>
    </Paper>
  );
}
