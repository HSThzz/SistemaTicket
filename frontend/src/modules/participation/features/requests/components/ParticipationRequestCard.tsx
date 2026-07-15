/**
 * @file Cartão de solicitação de participação em evento privado (visão do usuário).
 * @module components/participation/ParticipationRequestCard
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Divider,
  Group,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconBrandInstagram,
  IconCheck,
  IconClock,
  IconLock,
  IconMail,
  IconPhone,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import type { AuthUser, Event, ParticipationRequest } from "@/shared/types/api";
import * as participationService from "@/modules/participation/api/participationService";
import { eventPath } from "@/modules/catalog/utils/eventPaths";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import { getApiErrorMessage } from "@/shared/utils/errors";
import {  INSTAGRAM_HANDLE_INPUT_MAX_LENGTH,
  PHONE_BR_FORMATTED_MAX_LENGTH,
  formatInstagramHandleInput,
  formatPhoneBr,
  normalizeInstagramHandle,
} from "@/shared/utils/format";

interface ParticipationFormValues {
  phone: string;
  instagramHandle: string;
}

/**
 * Renderiza o fluxo de participação para eventos privados não liberados:
 * login, formulário de solicitação ou estado (pendente/recusada).
 */
export function ParticipationRequestCard({
  event,
  isAuthenticated,
  user,
  request,
  onSubmitted,
}: {
  event: Event;
  isAuthenticated: boolean;
  user: AuthUser | null;
  request: ParticipationRequest | null;
  onSubmitted: (request: ParticipationRequest) => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ParticipationFormValues>({
    initialValues: {
      phone: "",
      instagramHandle: "",
    },
  });

  if (!isAuthenticated) {
    return (
      <Stack gap="md">
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <ThemeIcon size={40} radius="md" variant="light" color="grape">
            <IconLock size={20} />
          </ThemeIcon>
          <Stack gap={2}>
            <Text fw={700}>Evento privado</Text>
            <Text size="sm" c="dimmed" style={{ lineHeight: 1.55 }}>
              Para participar, entre na sua conta e envie uma solicitação ao
              produtor.
            </Text>
          </Stack>
        </Group>
        <Button
          component={Link}
          to="/login"
          state={{ from: eventPath(event) }}
          radius="xl"
          fullWidth
        >
          Entrar para solicitar
        </Button>
        <Text size="sm" c="dimmed" ta="center">
          Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
        </Text>
      </Stack>
    );
  }

  if (request && request.status === "PENDING") {
    return (
      <Alert
        color="yellow"
        variant="light"
        radius="lg"
        icon={<IconClock size={18} />}
        title="Solicitação em análise"
      >
        Sua solicitação foi enviada e está aguardando a aprovação do produtor.
        Você poderá comprar o ingresso assim que for aprovada.
      </Alert>
    );
  }

  if (request && request.status === "REJECTED") {
    return (
      <Alert
        color="red"
        variant="light"
        radius="lg"
        icon={<IconX size={18} />}
        title="Solicitação recusada"
      >
        Infelizmente o produtor não aprovou sua participação neste evento.
      </Alert>
    );
  }

  const handleSubmit = form.onSubmit(async (values) => {
    setSubmitting(true);

    try {
      const created = await participationService.submitParticipationRequest(event.id, {
        phone: values.phone.trim() || undefined,
        instagramHandle: normalizeInstagramHandle(values.instagramHandle) || undefined,
      });

      notifications.show({
        title: "Solicitação enviada",
        message: "Você será avisado quando o produtor responder.",
        color: "green",
        icon: <IconCheck size={18} />,
      });

      onSubmitted(created);
    } catch (err) {
      notifications.show({
        title: "Não foi possível enviar",
        message: getApiErrorMessage(err, "Tente novamente em instantes."),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <ThemeIcon size={40} radius="md" variant="light" color="grape">
            <IconLock size={20} />
          </ThemeIcon>
          <Stack gap={2}>
            <Text fw={700}>Solicitar participação</Text>
            <Text size="sm" c="dimmed" style={{ lineHeight: 1.55 }}>
              Este é um evento privado. Usaremos os dados da sua conta; após a
              aprovação do produtor, você poderá comprar o ingresso.
            </Text>
          </Stack>
        </Group>

        <Divider />

        <TextInput
          label="Nome completo"
          radius="md"
          leftSection={<IconUser size={16} />}
          value={user?.name ?? ""}
          readOnly
        />
        <TextInput
          label="E-mail"
          radius="md"
          type="email"
          leftSection={<IconMail size={16} />}
          value={user?.email ?? ""}
          readOnly
        />
        <TextInput
          label="Telefone"
          radius="md"
          placeholder="(11) 99999-9999"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={PHONE_BR_FORMATTED_MAX_LENGTH}
          leftSection={<IconPhone size={16} />}
          value={form.values.phone}
          onChange={(event) =>
            form.setFieldValue("phone", formatPhoneBr(event.currentTarget.value))
          }
          error={form.errors.phone}
        />
        <TextInput
          label="Instagram"
          radius="md"
          placeholder="@seuusuario"
          autoComplete="off"
          maxLength={INSTAGRAM_HANDLE_INPUT_MAX_LENGTH}
          leftSection={<IconBrandInstagram size={16} />}
          value={form.values.instagramHandle}
          onChange={(event) =>
            form.setFieldValue(
              "instagramHandle",
              formatInstagramHandleInput(event.currentTarget.value),
            )
          }
          error={form.errors.instagramHandle}
        />

        <Button type="submit" radius="xl" fullWidth loading={submitting}>
          Enviar solicitação
        </Button>

        <Box>
          <PremiumBadge tone="brand" size="xs">
            Resposta enviada por e-mail
          </PremiumBadge>
        </Box>
      </Stack>
    </form>
  );
}
