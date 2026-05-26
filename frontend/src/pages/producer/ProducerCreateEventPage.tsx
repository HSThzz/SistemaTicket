import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Group, Stack, Textarea, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCalendarPlus, IconCheck, IconX } from "@tabler/icons-react";
import { AnimatedSection } from "../../components/home/AnimatedSection";
import { BackButton } from "../../components/account/BackButton";
import { PageHeader } from "../../components/account/PageHeader";
import { PremiumPaper } from "../../components/account/PremiumPaper";
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
    <Stack gap="lg" maw={720}>
      <BackButton to="/produtor" label="Voltar ao painel" />

      <AnimatedSection>
        <PageHeader
          icon={<IconCalendarPlus size={28} color="var(--mantine-color-brand-6)" />}
          title="Novo"
          highlight="evento"
          description="O evento será criado como rascunho até você publicar na vitrine."
        />
      </AnimatedSection>

      <AnimatedSection delayMs={80}>
        <PremiumPaper p="xl">
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput label="Título" placeholder="Nome do evento" radius="md" {...form.getInputProps("title")} />
              <Textarea
                label="Descrição"
                placeholder="Descreva o evento"
                minRows={4}
                radius="md"
                {...form.getInputProps("description")}
              />
              <TextInput
                label="Data e hora"
                type="datetime-local"
                radius="md"
                {...form.getInputProps("date")}
              />
              <TextInput
                label="Local"
                placeholder="Arena, endereço..."
                radius="md"
                {...form.getInputProps("location")}
              />
              <Group justify="flex-end" pt="sm">
                <Button type="submit" loading={submitting} radius="xl">
                  Criar evento
                </Button>
              </Group>
            </Stack>
          </form>
        </PremiumPaper>
      </AnimatedSection>
    </Stack>
  );
}
