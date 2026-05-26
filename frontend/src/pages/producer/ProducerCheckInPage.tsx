import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
  Divider,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconCheck, IconScan, IconX } from "@tabler/icons-react";
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
    <Stack gap="xl" maw={560}>
      <Button
        component={Link}
        to="/produtor"
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        w="fit-content"
      >
        Voltar ao painel
      </Button>

      <Stack gap={4}>
        <Title order={2}>Check-in na portaria</Title>
        <Text c="dimmed">Escaneie o QR code ou digite o código manualmente.</Text>
      </Stack>

      <Paper p="xl" radius="md" withBorder>
        <Stack gap="md">
          <Text fw={600}>Scanner de câmera</Text>
          <QrScanner onScan={handleScan} paused={scannerPaused || submitting} />
        </Stack>
      </Paper>

      <Divider label="ou digite o código" labelPosition="center" />

      <Paper p="xl" radius="md" withBorder>
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Código do ingresso"
              placeholder="Cole o código manualmente"
              leftSection={<IconScan size={18} />}
              {...form.getInputProps("uniqueCode")}
            />
            <Button type="submit" loading={submitting} fullWidth>
              Validar ingresso
            </Button>
          </Stack>
        </form>
      </Paper>

      {lastResult ? (
        <Alert color="green" title="Último check-in confirmado">
          <Stack gap={4}>
            <Text fw={600}>{lastResult.owner_name}</Text>
            <Text size="sm">Documento: {lastResult.owner_document}</Text>
            <Text size="sm">Evento: {lastResult.event_title}</Text>
            <Text size="sm">Horário: {formatShortDate(lastResult.checked_in_at)}</Text>
          </Stack>
        </Alert>
      ) : null}
    </Stack>
  );
}
