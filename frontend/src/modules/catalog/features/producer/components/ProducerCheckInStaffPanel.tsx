/**
 * @file Painel para gerenciar equipe de portaria de um evento.
 * @module modules/catalog/features/producer/components/ProducerCheckInStaffPanel
 */

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Group,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconScan, IconTrash, IconUserPlus, IconX } from "@tabler/icons-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { PremiumPaper } from "@/shared/components/PremiumPaper";
import * as eventService from "@/modules/catalog/api/eventService";
import { getApiErrorMessage } from "@/shared/utils/errors";

interface ProducerCheckInStaffPanelProps {
  eventId: string;
}

/**
 * Produtor adiciona/remove contas (por e-mail) autorizadas ao check-in do evento.
 */
export function ProducerCheckInStaffPanel({ eventId }: ProducerCheckInStaffPanelProps) {
  const [staff, setStaff] = useState<eventService.CheckInStaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const form = useForm({
    initialValues: { email: "" },
    validate: {
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value.trim()) ? null : "Informe um e-mail válido",
    },
  });

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await eventService.listCheckInStaff(eventId);
      setStaff(rows);
    } catch (err) {
      notifications.show({
        title: "Não foi possível carregar a equipe",
        message: getApiErrorMessage(err),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const handleAdd = form.onSubmit(async (values) => {
    setSubmitting(true);
    try {
      const member = await eventService.addCheckInStaff(eventId, values.email.trim());
      setStaff((prev) => [...prev, member]);
      form.reset();
      notifications.show({
        title: "Equipe atualizada",
        message: `${member.name} pode fazer check-in neste evento.`,
        color: "green",
        icon: <IconCheck size={18} />,
      });
    } catch (err) {
      notifications.show({
        title: "Não foi possível adicionar",
        message: getApiErrorMessage(err),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setSubmitting(false);
    }
  });

  const handleRemove = async (member: eventService.CheckInStaffMember) => {
    setRemovingUserId(member.userId);
    try {
      await eventService.removeCheckInStaff(eventId, member.userId);
      setStaff((prev) => prev.filter((row) => row.userId !== member.userId));
      notifications.show({
        title: "Membro removido",
        message: `${member.name} não tem mais acesso ao check-in.`,
        color: "green",
        icon: <IconCheck size={18} />,
      });
    } catch (err) {
      notifications.show({
        title: "Não foi possível remover",
        message: getApiErrorMessage(err),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setRemovingUserId(null);
    }
  };

  return (
    <PremiumPaper p="xl">
      <Stack gap="lg">
        <Group gap="sm" className="producer-form-section-title">
          <ThemeIcon size={36} radius="md" variant="light" color="brand">
            <IconScan size={20} />
          </ThemeIcon>
          <Stack gap={2}>
            <Title order={3} size="h4" className="producer-section-title">
              Equipe de portaria
            </Title>
            <Text c="dimmed" size="sm">
              Adicione contas existentes pelo e-mail. Elas só acessam o check-in deste evento.
            </Text>
          </Stack>
        </Group>

        <form onSubmit={handleAdd}>
          <Group align="flex-end" wrap="wrap" gap="sm">
            <TextInput
              label="E-mail da conta"
              placeholder="equipe@email.com"
              flex={1}
              miw={220}
              {...form.getInputProps("email")}
            />
            <Button
              type="submit"
              loading={submitting}
              leftSection={<IconUserPlus size={18} />}
              radius="xl"
            >
              Adicionar
            </Button>
          </Group>
        </form>

        {loading ? (
          <Text size="sm" c="dimmed">
            Carregando equipe…
          </Text>
        ) : staff.length === 0 ? (
          <EmptyState
            icon={<IconScan size={28} />}
            title="Ninguém na portaria ainda"
            description="Peça para a equipe criar uma conta e adicione o e-mail aqui."
          />
        ) : (
          <Stack gap="sm">
            {staff.map((member) => (
              <Group
                key={member.userId}
                justify="space-between"
                wrap="wrap"
                gap="sm"
                className="producer-checkin-staff-row"
              >
                <Stack gap={2} miw={0} style={{ flex: 1 }}>
                  <Text fw={600} size="sm" lineClamp={1}>
                    {member.name}
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {member.email}
                  </Text>
                </Stack>
                <Button
                  variant="subtle"
                  color="red"
                  size="compact-sm"
                  loading={removingUserId === member.userId}
                  leftSection={<IconTrash size={16} />}
                  onClick={() => void handleRemove(member)}
                >
                  Remover
                </Button>
              </Group>
            ))}
          </Stack>
        )}
      </Stack>
    </PremiumPaper>
  );
}
