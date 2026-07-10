/**
 * @file Página para solicitar link de redefinição de senha por e-mail.
 * @module pages/ForgotPasswordPage
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Anchor, Button, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconMail, IconX } from "@tabler/icons-react";
import { AuthCard } from "@/modules/identity/features/auth/components/AuthCard";
import * as authService from "@/modules/identity/api/authService";
import { getApiErrorMessage } from "@/shared/utils/errors";

interface ForgotPasswordFormValues {
  email: string;
}

/**
 * Envia e-mail de redefinição de senha (resposta genérica por segurança).
 */
export function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    initialValues: { email: "" },
    validate: {
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value.trim()) ? null : "Informe um e-mail válido",
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setSubmitting(true);

    try {
      await authService.forgotPassword({
        email: values.email.trim().toLowerCase(),
      });

      setSubmitted(true);

      notifications.show({
        title: "E-mail enviado",
        message: "Se existir uma conta com este e-mail, você receberá as instruções.",
        color: "green",
        icon: <IconCheck size={18} />,
      });
    } catch (error) {
      notifications.show({
        title: "Não foi possível enviar",
        message: getApiErrorMessage(error, "Tente novamente em alguns minutos."),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthCard
      title="Esqueceu sua"
      highlight="senha?"
      description="Informe o e-mail da sua conta. Se ela existir, enviaremos um link para redefinir a senha."
    >
      {submitted ? (
        <Stack gap="md">
          <Alert color="green" variant="light" icon={<IconMail size={16} />}>
            Se existir uma conta com o e-mail informado, você receberá um link válido por 1 hora.
            Verifique também a caixa de spam.
          </Alert>
          <Button component={Link} to="/login" fullWidth radius="xl">
            Voltar ao login
          </Button>
        </Stack>
      ) : (
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="E-mail"
              placeholder="voce@email.com"
              autoComplete="email"
              radius="md"
              {...form.getInputProps("email")}
            />
            <Button type="submit" loading={submitting} fullWidth radius="xl" size="md">
              Enviar link
            </Button>
          </Stack>
        </form>
      )}

      <Text size="sm" c="dimmed" ta="center">
        Lembrou a senha?{" "}
        <Anchor component={Link} to="/login" fw={600}>
          Entrar
        </Anchor>
      </Text>
    </AuthCard>
  );
}
