/**
 * @file Página de perfil do usuário: dados da conta, favoritos e senha.
 * @module pages/ProfilePage
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
  Group,
  PasswordInput,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconHeart,
  IconLock,
  IconSearch,
  IconUser,
  IconUserCircle,
} from "@tabler/icons-react";
import { EmptyState } from "../components/account/EmptyState";
import { PageHeader } from "../components/account/PageHeader";
import { PremiumPaper } from "../components/account/PremiumPaper";
import { ProfilePageSkeleton } from "../components/account/ProfilePageSkeleton";
import { DiceEventCard } from "../components/events/DiceEventCard";
import { useAuth } from "../context/AuthContext";
import * as authService from "../features/identity/api/authService";
import * as favoritesService from "../features/identity/api/favoritesService";
import { useFavorites } from "../hooks/useFavorites";
import type { AuthUser, Event, UserRole } from "../types/api";
import { getApiErrorMessage } from "../utils/errors";
import { formatCpf, normalizeDocument } from "../utils/format";

interface ProfileFormValues {
  name: string;
  email: string;
  document: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  CLIENT: "Cliente",
  PRODUCER: "Produtor",
  ADMIN: "Administrador",
};

/**
 * Página de conta com edição de perfil, alteração de senha e lista de favoritos.
 */
export function ProfilePage() {
  const { user, updateUserProfile } = useAuth();
  const { favoriteIds, isReady: favoritesReady } = useFavorites();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [favoriteEvents, setFavoriteEvents] = useState<Event[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);

  const profileForm = useForm<ProfileFormValues>({
    initialValues: {
      name: "",
      email: "",
      document: "",
    },
    validate: {
      name: (value) => (value.trim().length >= 2 ? null : "Informe seu nome"),
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value.trim()) ? null : "Informe um e-mail válido",
      document: (value) =>
        normalizeDocument(value).length === 11
          ? null
          : "Informe um CPF com 11 dígitos",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validate: {
      currentPassword: (value) => (value.length > 0 ? null : "Informe a senha atual"),
      newPassword: (value) =>
        value.length >= 6 ? null : "A nova senha deve ter pelo menos 6 caracteres",
      confirmPassword: (value, values) =>
        value === values.newPassword ? null : "As senhas não coincidem",
    },
  });

  useEffect(() => {
    let cancelled = false;

    setLoadingProfile(true);
    setProfileError(null);

    authService
      .getMe()
      .then((loadedProfile) => {
        if (!cancelled) {
          setProfile(loadedProfile);
          profileForm.setValues({
            name: loadedProfile.name,
            email: loadedProfile.email,
            document: loadedProfile.document ? formatCpf(loadedProfile.document) : "",
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setProfileError(getApiErrorMessage(err, "Não foi possível carregar seu perfil."));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!favoritesReady) {
      return;
    }

    if (favoriteIds.length === 0) {
      setFavoriteEvents([]);
      setFavoritesError(null);
      return;
    }

    let cancelled = false;

    setLoadingFavorites(true);
    setFavoritesError(null);

    favoritesService
      .listFavoriteEvents()
      .then((events) => {
        if (!cancelled) {
          setFavoriteEvents(events);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setFavoritesError(
            getApiErrorMessage(err, "Não foi possível carregar seus favoritos."),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingFavorites(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [favoriteIds, favoritesReady]);

  const displayRole = useMemo(() => {
    const role = profile?.role ?? user?.role;
    return role ? ROLE_LABELS[role] : "Cliente";
  }, [profile?.role, user?.role]);

  const handleProfileSubmit = profileForm.onSubmit(async (values) => {
    setSavingProfile(true);

    try {
      const updatedProfile = await authService.updateProfile({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        document: normalizeDocument(values.document),
      });

      setProfile(updatedProfile);
      updateUserProfile(updatedProfile);
      profileForm.setValues({
        name: updatedProfile.name,
        email: updatedProfile.email,
        document: updatedProfile.document ? formatCpf(updatedProfile.document) : "",
      });

      notifications.show({
        title: "Perfil atualizado",
        message: "Suas informações foram salvas com sucesso.",
        color: "green",
      });
    } catch (err) {
      notifications.show({
        title: "Erro ao salvar",
        message: getApiErrorMessage(err, "Não foi possível atualizar seu perfil."),
        color: "red",
      });
    } finally {
      setSavingProfile(false);
    }
  });

  const handlePasswordSubmit = passwordForm.onSubmit(async (values) => {
    setSavingPassword(true);

    try {
      await authService.updatePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      passwordForm.reset();

      notifications.show({
        title: "Senha alterada",
        message: "Sua nova senha já está ativa.",
        color: "green",
      });
    } catch (err) {
      notifications.show({
        title: "Erro ao alterar senha",
        message: getApiErrorMessage(err, "Não foi possível alterar sua senha."),
        color: "red",
      });
    } finally {
      setSavingPassword(false);
    }
  });

  if (loadingProfile) {
    return <ProfilePageSkeleton />;
  }

  return (
    <Stack gap="xl" className="profile-page">
      <PageHeader
        icon={<IconUserCircle size={32} stroke={1.5} className="page-title-icon" />}
        title="Minha"
        highlight="conta"
        description="Gerencie seus dados, favoritos e segurança em um só lugar."
      />

      {profileError ? (
        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
          {profileError}
        </Alert>
      ) : null}

      <Tabs defaultValue="account" variant="pills" radius="xl" className="profile-tabs">
        <Tabs.List grow className="profile-tabs__list">
          <Tabs.Tab value="account" leftSection={<IconUser size={16} />}>
            Dados
          </Tabs.Tab>
          <Tabs.Tab
            value="favorites"
            leftSection={<IconHeart size={16} />}
          >
            Favoritos{favoriteIds.length > 0 ? ` (${favoriteIds.length})` : ""}
          </Tabs.Tab>
          <Tabs.Tab value="security" leftSection={<IconLock size={16} />}>
            Senha
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="account" pt="lg">
          <PremiumPaper p={{ base: "md", sm: "lg" }}>
            <form onSubmit={handleProfileSubmit}>
              <Stack gap="md">
                <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                  <Text fw={600}>Informações da conta</Text>
                  <Badge variant="light" size="lg">
                    {displayRole}
                  </Badge>
                </Group>

                <TextInput
                  label="Nome completo"
                  placeholder="Seu nome"
                  required
                  {...profileForm.getInputProps("name")}
                />
                <TextInput
                  label="E-mail"
                  placeholder="voce@email.com"
                  type="email"
                  required
                  {...profileForm.getInputProps("email")}
                />
                <TextInput
                  label="CPF"
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  required
                  value={profileForm.values.document}
                  onChange={(event) =>
                    profileForm.setFieldValue("document", formatCpf(event.currentTarget.value))
                  }
                  error={profileForm.errors.document}
                />

                <Button type="submit" loading={savingProfile} w={{ base: "100%", sm: "auto" }}>
                  Salvar alterações
                </Button>
              </Stack>
            </form>
          </PremiumPaper>
        </Tabs.Panel>

        <Tabs.Panel value="favorites" pt="lg">
          {favoritesError ? (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" mb="md">
              {favoritesError}
            </Alert>
          ) : null}

          {favoriteIds.length === 0 ? (
            <EmptyState
              icon={<IconHeart size={40} stroke={1.5} />}
              title="Nenhum favorito ainda"
              description="Salve eventos tocando no coração nos cards da vitrine. Eles aparecerão aqui."
              action={
                <Button component={Link} to="/eventos" leftSection={<IconSearch size={16} />}>
                  Explorar eventos
                </Button>
              }
            />
          ) : loadingFavorites ? (
            <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
              {favoriteIds.map((id) => (
                <Skeleton key={id} h={220} radius="md" className="skeleton-shimmer" />
              ))}
            </SimpleGrid>
          ) : favoriteEvents.length > 0 ? (
            <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
              {favoriteEvents.map((event) => (
                <DiceEventCard key={event.id} event={event} />
              ))}
            </SimpleGrid>
          ) : (
            <EmptyState
              icon={<IconHeart size={40} stroke={1.5} />}
              title="Eventos indisponíveis"
              description="Alguns favoritos podem ter sido removidos ou não estão mais publicados."
              action={
                <Button component={Link} to="/eventos" variant="light">
                  Ver eventos ativos
                </Button>
              }
            />
          )}
        </Tabs.Panel>

        <Tabs.Panel value="security" pt="lg">
          <PremiumPaper p={{ base: "md", sm: "lg" }}>
            <form onSubmit={handlePasswordSubmit}>
              <Stack gap="md">
                <Stack gap={4}>
                  <Text fw={600}>Alterar senha</Text>
                  <Text size="sm" c="dimmed">
                    Use uma senha forte com pelo menos 6 caracteres.
                  </Text>
                </Stack>

                <PasswordInput
                  label="Senha atual"
                  placeholder="Sua senha atual"
                  required
                  {...passwordForm.getInputProps("currentPassword")}
                />
                <PasswordInput
                  label="Nova senha"
                  placeholder="Nova senha"
                  required
                  {...passwordForm.getInputProps("newPassword")}
                />
                <PasswordInput
                  label="Confirmar nova senha"
                  placeholder="Repita a nova senha"
                  required
                  {...passwordForm.getInputProps("confirmPassword")}
                />

                <Button type="submit" loading={savingPassword} w={{ base: "100%", sm: "auto" }}>
                  Atualizar senha
                </Button>
              </Stack>
            </form>
          </PremiumPaper>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
