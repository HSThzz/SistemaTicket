/**
 * @file Página de login com redirecionamento pós-autenticação.
 * @module pages/LoginPage
 */

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Anchor, Button, PasswordInput, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconLogin, IconX } from "@tabler/icons-react";
import { AuthCard } from "@/modules/identity/features/auth/components/AuthCard";
import { useAuth } from "@/modules/identity/features/auth/context/AuthContext";
import * as authService from "@/modules/identity/api/authService";
import { getApiErrorMessage } from "@/shared/utils/errors";

interface LoginFormValues {
  email: string;
  password: string;
}

/**
 * Formulário de e-mail/senha; restaura rota original via `location.state.from`.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/";

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
    <AuthCard
      title="Bem-vindo"
      highlight="de volta"
      description="Acesse sua conta para comprar ingressos, ver pedidos e gerenciar seus tickets."
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="E-mail"
            placeholder="seu@email.com"
            autoComplete="email"
            radius="md"
            {...form.getInputProps("email")}
          />
          <PasswordInput
            label="Senha"
            placeholder="Sua senha"
            autoComplete="current-password"
            radius="md"
            {...form.getInputProps("password")}
          />
          <Anchor component={Link} to="/esqueci-senha" size="sm">
            Esqueci minha senha
          </Anchor>
          <Button type="submit" loading={submitting} fullWidth radius="xl" size="md">
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

      <Button
        component={Link}
        to="/eventos"
        variant="subtle"
        radius="xl"
        fullWidth
        leftSection={<IconLogin size={16} />}
      >
        Voltar aos eventos
      </Button>
    </AuthCard>
  );
}
