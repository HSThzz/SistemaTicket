import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Anchor,
  Button,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconUserPlus, IconX } from "@tabler/icons-react";
import { AuthCard } from "../components/account/AuthCard";
import { useAuth } from "../context/AuthContext";
import * as authService from "../features/identity/api/authService";
import { getApiErrorMessage } from "../utils/errors";

interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  document: string;
}

function normalizeDocument(value: string): string {
  return value.replace(/\D/g, "");
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<RegisterFormValues>({
    initialValues: {
      name: "",
      email: "",
      password: "",
      document: "",
    },
    validate: {
      name: (value) => (value.trim().length >= 2 ? null : "Informe seu nome"),
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value.trim()) ? null : "Informe um e-mail válido",
      password: (value) =>
        value.length >= 6 ? null : "A senha deve ter pelo menos 6 caracteres",
      document: (value) =>
        normalizeDocument(value).length === 11
          ? null
          : "Informe um CPF com 11 dígitos",
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setSubmitting(true);

    try {
      const response = await authService.register({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        document: normalizeDocument(values.document),
      });

      setSession(response.token, response.user);

      notifications.show({
        title: "Conta criada",
        message: "Cadastro concluído com sucesso!",
        color: "green",
        icon: <IconCheck size={18} />,
      });

      navigate("/", { replace: true });
    } catch (error) {
      notifications.show({
        title: "Falha no cadastro",
        message: getApiErrorMessage(error, "Não foi possível criar a conta."),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthCard
      title="Crie sua"
      highlight="conta"
      description="Cadastre-se em segundos para reservar ingressos, pagar com PIX e receber seus tickets na hora."
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Nome completo"
            placeholder="Seu nome"
            autoComplete="name"
            radius="md"
            {...form.getInputProps("name")}
          />
          <TextInput
            label="E-mail"
            placeholder="seu@email.com"
            autoComplete="email"
            radius="md"
            {...form.getInputProps("email")}
          />
          <TextInput
            label="CPF"
            placeholder="000.000.000-00"
            inputMode="numeric"
            radius="md"
            {...form.getInputProps("document")}
          />
          <PasswordInput
            label="Senha"
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            radius="md"
            {...form.getInputProps("password")}
          />
          <Button type="submit" loading={submitting} fullWidth radius="xl" size="md">
            Cadastrar
          </Button>
        </Stack>
      </form>

      <Text size="sm" c="dimmed" ta="center">
        Já tem conta?{" "}
        <Anchor component={Link} to="/login" fw={600}>
          Entrar
        </Anchor>
      </Text>

      <Button
        component={Link}
        to="/"
        variant="subtle"
        radius="xl"
        fullWidth
        leftSection={<IconUserPlus size={16} />}
      >
        Explorar sem cadastro
      </Button>
    </AuthCard>
  );
}
