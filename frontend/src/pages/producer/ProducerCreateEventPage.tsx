import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconCheck, IconX } from "@tabler/icons-react";
import * as eventService from "../../services/eventService";
import { getApiErrorMessage } from "../../utils/errors";

interface CreateEventFormValues {
  title: string;
  description: string;
  date: string;
  location: string;
}

function toIsoDate(localDateTime: string): string {
  return new Date(localDateTime).toISOString();
}

export function ProducerCreateEventPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateEventFormValues>({
    initialValues: {
      title: "",
      description: "",
      date: "",
      location: "",
    },
    validate: {
      title: (value) => (value.trim().length >= 3 ? null : "Informe o título"),
      description: (value) => (value.trim().length >= 10 ? null : "Descrição muito curta"),
      date: (value) => (value ? null : "Informe a data do evento"),
      location: (value) => (value.trim().length >= 3 ? null : "Informe o local"),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setSubmitting(true);

    try {
      const event = await eventService.createEvent({
        title: values.title.trim(),
        description: values.description.trim(),
        date: toIsoDate(values.date),
        location: values.location.trim(),
        status: "DRAFT",
      });

      notifications.show({
        title: "Evento criado",
        message: "Agora adicione lotes de ingressos.",
        color: "green",
        icon: <IconCheck size={18} />,
      });

      navigate(`/produtor/eventos/${event.id}`);
    } catch (error) {
      notifications.show({
        title: "Erro ao criar evento",
        message: getApiErrorMessage(error),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Stack gap="xl" maw={640}>
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
        <Title order={2}>Novo evento</Title>
        <Text c="dimmed">O evento será criado como rascunho até você publicar.</Text>
      </Stack>

      <Paper p="xl" radius="md" withBorder>
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput label="Título" placeholder="Nome do evento" {...form.getInputProps("title")} />
            <Textarea
              label="Descrição"
              placeholder="Descreva o evento"
              minRows={4}
              {...form.getInputProps("description")}
            />
            <TextInput
              label="Data e hora"
              type="datetime-local"
              {...form.getInputProps("date")}
            />
            <TextInput label="Local" placeholder="Arena, endereço..." {...form.getInputProps("location")} />
            <Group justify="flex-end">
              <Button type="submit" loading={submitting}>
                Criar evento
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
