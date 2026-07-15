/**
 * @file Ações para adicionar ingresso à Apple Wallet ou Google Wallet.
 * @module components/TicketWalletActions
 */

import { useCallback, useState } from "react";
import { Box, Button, Group, Stack, Text, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBrandApple, IconBrandGoogle, IconWallet } from "@tabler/icons-react";
import * as walletService from "@/modules/ticketing/api/walletService";
import { useResetOnPageReturn } from "@/shared/hooks/useResetOnPageReturn";

/** Propriedades dos botões de carteira digital. */
interface TicketWalletActionsProps {
  /** ID do ingresso usado nas rotas `/wallet/apple` e `/wallet/google`. */
  ticketId: string;
}

/**
 * Botões Apple Wallet e Google Wallet com feedback via notificações Mantine.
 * Apple Wallet permanece desabilitado enquanto a integração está em desenvolvimento.
 */
export function TicketWalletActions({ ticketId }: TicketWalletActionsProps) {
  const [googleLoading, setGoogleLoading] = useState(false);

  useResetOnPageReturn(
    useCallback(() => {
      setGoogleLoading(false);
    }, []),
  );

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
        <Tooltip label="Em desenvolvimento" withArrow position="top">
          <Box component="span" display="block" style={{ flex: 1 }}>
            <Button
              fullWidth
              variant="light"
              color="dark"
              radius="xl"
              leftSection={<IconBrandApple size={18} />}
              disabled
            >
              Apple Wallet
            </Button>
          </Box>
        </Tooltip>
        <Button
          variant="light"
          color="blue"
          radius="xl"
          leftSection={<IconBrandGoogle size={18} />}
          loading={googleLoading}
          onClick={() => void handleGoogleWallet()}
        >
          Google Wallet
        </Button>
      </Group>
    </Stack>
  );
}
