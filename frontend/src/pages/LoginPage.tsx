import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Anchor,
  Button,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useAuth } from "../context/AuthContext";
import * as authService from "../services/authService";
import { getApiErrorMessage } from "../utils/errors";

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const from =
    (location.state as { from?: string } | null)?.from ?? "/";

  const form = useForm<LoginFormValues>({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value.trim()) ? null : "Informe um e-mail válido",
      password: (value) =>
        value.length >= 6 ? null : "A senha deve ter pelo menos 6 caracteres",
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setSubmitting(true);

    try {
      const response = await authService.login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });

      setSession(response.token, response.user);

      notifications.show({
        title: "Login realizado",
        message: `Bem-vindo, ${response.user.name}!`,
        color: "green",
        icon: <IconCheck size={18} />,
      });

      navigate(from, { replace: true });
    } catch (error) {
      notifications.show({
        title: "Falha no login",
        message: getApiErrorMessage(error, "Credenciais inválidas."),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Paper p="xl" radius="md" maw={440} mx="auto" withBorder>
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={2}>Entrar</Title>
          <Text c="dimmed">Acesse sua conta para comprar ingressos.</Text>
        </Stack>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="E-mail"
              placeholder="seu@email.com"
              autoComplete="email"
              {...form.getInputProps("email")}
            />
            <PasswordInput
              label="Senha"
              placeholder="Sua senha"
              autoComplete="current-password"
              {...form.getInputProps("password")}
            />
            <Button type="submit" loading={submitting} fullWidth>
              Entrar
            </Button>
          </Stack>
        </form>

        <Text size="sm" c="dimmed" ta="center">
          Ainda não tem conta?{" "}
          <Anchor component={Link} to="/cadastro" fw={600}>
            Cadastre-se
          </Anchor>
        </Text>
      </Stack>
    </Paper>
  );
}
