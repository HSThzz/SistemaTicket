import { useState } from "react";
import { Button, Group, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBrandApple, IconBrandGoogle, IconWallet } from "@tabler/icons-react";
import * as walletService from "../features/ticketing/api/walletService";

interface TicketWalletActionsProps {
  ticketId: string;
}

export function TicketWalletActions({ ticketId }: TicketWalletActionsProps) {
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleAppleWallet() {
    setAppleLoading(true);
    try {
      await walletService.downloadAppleWalletPass(ticketId);
    } catch (error) {
      notifications.show({
        title: "Apple Wallet",
        message: await walletService.getWalletErrorMessage(
          error,
          "Não foi possível gerar o pass da Apple Wallet.",
        ),
        color: "red",
      });
    } finally {
      setAppleLoading(false);
    }
  }

  async function handleGoogleWallet() {
    setGoogleLoading(true);
    try {
      await walletService.openGoogleWallet(ticketId);
    } catch (error) {
      notifications.show({
        title: "Google Wallet",
        message: await walletService.getWalletErrorMessage(
          error,
          "Não foi possível abrir o Google Wallet.",
        ),
        color: "red",
      });
      setGoogleLoading(false);
    }
  }

  return (
    <Stack gap="sm" className="ticket-wallet-actions">
      <Group gap={8} wrap="nowrap">
        <IconWallet size={18} style={{ flexShrink: 0, opacity: 0.75 }} />
        <Text size="sm" fw={600}>
          Salvar na carteira do celular
        </Text>
      </Group>
      <Text size="xs" c="dimmed">
        Adicione o ingresso à Apple Wallet (iPhone) ou Google Wallet (Android) para acesso rápido na
        entrada.
      </Text>
      <Group gap="sm" grow>
        <Button
          variant="light"
          color="dark"
          radius="xl"
          leftSection={<IconBrandApple size={18} />}
          loading={appleLoading}
          disabled={googleLoading}
          onClick={() => void handleAppleWallet()}
        >
          Apple Wallet
        </Button>
        <Button
          variant="light"
          color="blue"
          radius="xl"
          leftSection={<IconBrandGoogle size={18} />}
          loading={googleLoading}
          disabled={appleLoading}
          onClick={() => void handleGoogleWallet()}
        >
          Google Wallet
        </Button>
      </Group>
    </Stack>
  );
}
