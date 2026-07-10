/**
 * @file Página para definir nova senha com token recebido por e-mail.
 * @module pages/ResetPasswordPage
 */

import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Anchor,
  Button,
  PasswordInput,
  Stack,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck, IconX } from "@tabler/icons-react";
import { AuthCard } from "@/modules/identity/features/auth/components/AuthCard";
import { useAuth } from "@/modules/identity/features/auth/context/AuthContext";
import * as authService from "@/modules/identity/api/authService";
import { getApiErrorMessage } from "@/shared/utils/errors";
import {
  PASSWORD_REQUIREMENTS_HINT,
  validatePassword,
} from "@/shared/utils/passwordValidation";

interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

/**
 * Redefine a senha usando token da URL e inicia sessão com o novo JWT.
 */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setSession } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  const form = useForm<ResetPasswordFormValues>({
    initialValues: {
      newPassword: "",
      confirmPassword: "",
    },
    validate: {
      newPassword: (value) => validatePassword(value),
      confirmPassword: (value, values) =>
        value === values.newPassword ? null : "As senhas não coincidem",
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    if (!token) {
      return;
    }

    setSubmitting(true);

    try {
      const session = await authService.resetPassword({
        token,
        newPassword: values.newPassword,
      });

      setSession(session.token, session.user);

      notifications.show({
        title: "Senha redefinida",
        message: "Sua conta está pronta. Outras sessões foram encerradas.",
        color: "green",
        icon: <IconCheck size={18} />,
      });

      navigate("/", { replace: true });
    } catch (error) {
      notifications.show({
        title: "Não foi possível redefinir",
        message: getApiErrorMessage(error, "Solicite um novo link de redefinição."),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setSubmitting(false);
    }
  });

  if (!token) {
    return (
      <AuthCard
        title="Link"
        highlight="inválido"
        description="Este link de redefinição está incompleto ou expirou."
      >
        <Stack gap="md">
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            Solicite um novo e-mail para redefinir sua senha.
          </Alert>
          <Button component={Link} to="/esqueci-senha" fullWidth radius="xl">
            Solicitar novo link
          </Button>
          <Button component={Link} to="/login" variant="subtle" fullWidth radius="xl">
            Voltar ao login
          </Button>
        </Stack>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Nova"
      highlight="senha"
      description="Escolha uma senha forte para proteger sua conta."
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {PASSWORD_REQUIREMENTS_HINT}
          </Text>

          <PasswordInput
            label="Nova senha"
            placeholder="Nova senha"
            autoComplete="new-password"
            radius="md"
            {...form.getInputProps("newPassword")}
          />
          <PasswordInput
            label="Confirmar nova senha"
            placeholder="Repita a nova senha"
            autoComplete="new-password"
            radius="md"
            {...form.getInputProps("confirmPassword")}
          />

          <Button type="submit" loading={submitting} fullWidth radius="xl" size="md">
            Salvar nova senha
          </Button>
        </Stack>
      </form>

      <Text size="sm" c="dimmed" ta="center">
        <Anchor component={Link} to="/login" fw={600}>
          Voltar ao login
        </Anchor>
      </Text>
    </AuthCard>
  );
}
