/**
 * @file Formulário de criação de novo evento pelo produtor.
 * @module pages/producer/ProducerCreateEventPage
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Container,
  Grid,
  Group,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconCalendar,
  IconCalendarPlus,
  IconCheck,
  IconMapPin,
  IconPhoto,
  IconRocket,
  IconTicket,
  IconX,
} from "@tabler/icons-react";
import { AnimatedSection } from "../../components/home/AnimatedSection";
import { BackButton } from "../../components/account/BackButton";
import { PremiumPaper } from "../../components/account/PremiumPaper";
import * as eventService from "../../features/catalog/api/eventService";
import { getApiErrorMessage } from "../../utils/errors";

interface CreateEventFormValues {
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl: string;
}

const CREATE_STEPS = [
  {
    title: "Dados do evento",
    description: "Título, descrição, data e local — tudo que o público verá na vitrine.",
  },
  {
    title: "Lotes de ingressos",
    description: "Após criar, você define preços e quantidades de cada lote.",
  },
  {
    title: "Publicar",
    description: "Enquanto for rascunho, só você vê. Publique quando estiver pronto.",
  },
] as const;

function toIsoDate(localDateTime: string): string {
  return new Date(localDateTime).toISOString();
}

function CreateStep({ index, title, description }: { index: number; title: string; description: string }) {
  return (
    <Box className="producer-create-step">
      <span className="producer-create-step-number">{index}</span>
      <Stack gap={4}>
        <Text fw={600} size="sm">
          {title}
        </Text>
        <Text size="sm" c="dimmed" style={{ lineHeight: 1.5 }}>
          {description}
        </Text>
      </Stack>
    </Box>
  );
}

/**
 * Cria evento com título, descrição, data, local e imagem; redireciona para gestão.
 */
export function ProducerCreateEventPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateEventFormValues>({
    initialValues: {
      title: "",
      description: "",
      date: "",
      location: "",
      imageUrl: "",
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
        imageUrl: values.imageUrl.trim() || null,
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
    <Stack gap={0}>
      <Box className="producer-create-hero producer-manage-hero full-bleed">
        <Box className="producer-manage-hero-overlay" />
        <Container size="lg" px="md" className="producer-manage-hero-content">
          <Stack gap="md">
            <BackButton to="/produtor/eventos" label="Voltar aos eventos" inverted style={{ alignSelf: "flex-start" }} />
            <Stack gap="sm" maw={640}>
              <Group gap="sm" wrap="wrap">
                <Badge color="gray" variant="filled" radius="sm">
                  Rascunho
                </Badge>
                <Badge color="white" c="dark" variant="filled" radius="sm">
                  Novo cadastro
                </Badge>
              </Group>
              <Title
                order={1}
                style={{
                  fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                }}
              >
                Criar novo evento
              </Title>
              <Text size="md" c="white" opacity={0.9} maw={520}>
                Preencha as informações abaixo. O evento começa como rascunho até você publicar na
                vitrine.
              </Text>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container size="lg" py="xl" px="md">
        <Grid>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <AnimatedSection delayMs={60}>
              <PremiumPaper p="xl">
                <form onSubmit={handleSubmit}>
                  <Stack gap="lg">
                    <Group gap="sm" className="producer-form-section-title">
                      <ThemeIcon size={36} radius="md" variant="light" color="brand">
                        <IconCalendarPlus size={18} />
                      </ThemeIcon>
                      <Title order={3} size="h4" className="producer-section-title">
                        Informações do evento
                      </Title>
                    </Group>

                    <TextInput
                      label="Título"
                      placeholder="Ex.: Festival de Verão 2026"
                      radius="md"
                      {...form.getInputProps("title")}
                    />
                    <Textarea
                      label="Descrição"
                      placeholder="Conte o que torna este evento especial..."
                      minRows={5}
                      radius="md"
                      {...form.getInputProps("description")}
                    />
                    <TextInput
                      label="Data e hora"
                      type="datetime-local"
                      radius="md"
                      leftSection={<IconCalendar size={16} />}
                      {...form.getInputProps("date")}
                    />
                    <TextInput
                      label="Local"
                      placeholder="Arena, cidade — endereço completo"
                      radius="md"
                      leftSection={<IconMapPin size={16} />}
                      {...form.getInputProps("location")}
                    />
                    <TextInput
                      label="URL da imagem de capa"
                      placeholder="https://images.unsplash.com/..."
                      radius="md"
                      leftSection={<IconPhoto size={16} />}
                      description="Opcional. Use uma URL pública (ex.: Unsplash) para a capa do evento."
                      {...form.getInputProps("imageUrl")}
                    />

                    <Group justify="space-between" pt="md" wrap="wrap" gap="sm">
                      <Button
                        component={Link}
                        to="/produtor/eventos"
                        variant="subtle"
                        radius="xl"
                        disabled={submitting}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        loading={submitting}
                        radius="xl"
                        leftSection={<IconRocket size={18} />}
                      >
                        Criar e continuar
                      </Button>
                    </Group>
                  </Stack>
                </form>
              </PremiumPaper>
            </AnimatedSection>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }}>
            <AnimatedSection delayMs={100}>
              <Stack gap="md">
                <PremiumPaper p="xl">
                  <Stack gap="lg">
                    <Group gap="sm">
                      <ThemeIcon size={36} radius="md" variant="light" color="teal">
                        <IconTicket size={18} />
                      </ThemeIcon>
                      <Title order={4} size="h5">
                        Próximos passos
                      </Title>
                    </Group>
                    <Stack gap="lg" className="producer-create-steps">
                      {CREATE_STEPS.map((step, index) => (
                        <CreateStep
                          key={step.title}
                          index={index + 1}
                          title={step.title}
                          description={step.description}
                        />
                      ))}
                    </Stack>
                  </Stack>
                </PremiumPaper>

                <PremiumPaper p="lg">
                  <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                    Dica: você pode editar tudo depois em{" "}
                    <Text span fw={600} c="brand">
                      Gerenciar evento
                    </Text>
                    , incluindo status, lotes e publicação na vitrine pública.
                  </Text>
                </PremiumPaper>
              </Stack>
            </AnimatedSection>
          </Grid.Col>
        </Grid>
      </Container>
    </Stack>
  );
}
