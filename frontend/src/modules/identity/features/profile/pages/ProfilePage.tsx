/**
 * @file Página de perfil do usuário: dados da conta, favoritos e senha.
 * @module pages/ProfilePage
 */

import { useEffect, useMemo, useRef, useState } from "react";
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
import { AccountQuickLinks } from "@/modules/identity/features/profile/components/AccountQuickLinks";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageHeader } from "@/shared/components/PageHeader";
import { PremiumPaper } from "@/shared/components/PremiumPaper";
import { ProfilePageSkeleton } from "@/modules/identity/features/profile/components/ProfilePageSkeleton";
import { DiceEventCard } from "@/modules/catalog/features/browse/components/DiceEventCard";
import { useAuth } from "@/modules/identity/features/auth/context/AuthContext";
import * as authService from "@/modules/identity/api/authService";
import * as favoritesService from "@/modules/identity/api/favoritesService";
import { useFavorites } from "@/modules/identity/features/profile/hooks/useFavorites";
import type { AuthUser, Event } from "@/shared/types/api";
import { getApiErrorMessage } from "@/shared/utils/errors";
import { formatCpf, normalizeDocument, CPF_FORMATTED_MAX_LENGTH } from "@/shared/utils/format";
import {
  PASSWORD_REQUIREMENTS_HINT,
  validatePassword,
} from "@/shared/utils/passwordValidation";
import { ROLE_LABELS } from "@/modules/identity/features/admin/utils/adminRoles";

interface ProfileFormValues {
  name: string;
  email: string;
  document: string;
  currentPassword: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Página de conta com edição de perfil, alteração de senha e lista de favoritos.
 */
export function ProfilePage() {
  const { user, updateUserProfile, setSession } = useAuth();
  const { favoriteIds, isReady: favoritesReady } = useFavorites();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [favoriteEvents, setFavoriteEvents] = useState<Event[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const knownFavoriteIdsRef = useRef<Set<string>>(new Set());

  const profileForm = useForm<ProfileFormValues>({
    initialValues: {
      name: "",
      email: "",
      document: "",
      currentPassword: "",
    },
    validate: {
      name: (value) => (value.trim().length >= 2 ? null : "Informe seu nome"),
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value.trim()) ? null : "Informe um e-mail válido",
      document: (value) =>
        normalizeDocument(value).length === 11
          ? null
          : "Informe um CPF com 11 dígitos",
      currentPassword: (value, values) => {
        const originalEmail = (profile?.email ?? "").toLowerCase();
        const nextEmail = values.email.trim().toLowerCase();
        if (nextEmail !== originalEmail && value.length === 0) {
          return "Informe a senha atual para alterar o e-mail";
        }
        return null;
      },
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
      newPassword: (value, values) => {
        const complexityError = validatePassword(value);
        if (complexityError) {
          return complexityError;
        }

        if (value === values.currentPassword) {
          return "A nova senha deve ser diferente da senha atual";
        }

        return null;
      },
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
            currentPassword: "",
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
      knownFavoriteIdsRef.current = new Set();
      setFavoriteEvents((current) => (current.length === 0 ? current : []));
      setFavoritesError(null);
      return;
    }

    const favoriteIdSet = new Set(favoriteIds);
    const hasNewFavorite = favoriteIds.some((id) => !knownFavoriteIdsRef.current.has(id));

    knownFavoriteIdsRef.current = new Set(
      [...knownFavoriteIdsRef.current].filter((id) => favoriteIdSet.has(id)),
    );

    if (!hasNewFavorite) {
      return;
    }

    let cancelled = false;

    setLoadingFavorites(true);
    setFavoritesError(null);

    favoritesService
      .listFavoriteEvents()
      .then((events) => {
        if (!cancelled) {
          favoriteIds.forEach((id) => knownFavoriteIdsRef.current.add(id));
          setFavoriteEvents(events);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          favoriteIds.forEach((id) => knownFavoriteIdsRef.current.add(id));
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

  const displayedFavorites = useMemo(
    () => favoriteEvents.filter((event) => favoriteIds.includes(event.id)),
    [favoriteEvents, favoriteIds],
  );

  const displayRole = useMemo(() => {
    const role = profile?.role ?? user?.role;
    return role ? ROLE_LABELS[role] : "Cliente";
  }, [profile?.role, user?.role]);

  const handleProfileSubmit = profileForm.onSubmit(async (values) => {
    setSavingProfile(true);

    try {
      const nextEmail = values.email.trim().toLowerCase();
      const emailChanged = nextEmail !== (profile?.email ?? "").toLowerCase();

      const updatedProfile = await authService.updateProfile({
        name: values.name.trim(),
        email: nextEmail,
        document: normalizeDocument(values.document),
        ...(emailChanged ? { currentPassword: values.currentPassword } : {}),
      });

      setProfile(updatedProfile);
      updateUserProfile(updatedProfile);
      profileForm.setValues({
        name: updatedProfile.name,
        email: updatedProfile.email,
        document: updatedProfile.document ? formatCpf(updatedProfile.document) : "",
        currentPassword: "",
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
      const session = await authService.updatePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      setSession(session.token, session.user);
      passwordForm.reset();

      notifications.show({
        title: "Senha alterada",
        message: "Sua nova senha já está ativa. Outras sessões foram encerradas.",
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
        description="Gerencie seus dados, compras, favoritos e segurança em um só lugar."
      />

      {profileError ? (
        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
          {profileError}
        </Alert>
      ) : null}

      <AccountQuickLinks />

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
                  maxLength={255}
                  {...profileForm.getInputProps("name")}
                />
                <TextInput
                  label="E-mail"
                  placeholder="voce@email.com"
                  type="email"
                  required
                  maxLength={255}
                  {...profileForm.getInputProps("email")}
                />
                {profileForm.values.email.trim().toLowerCase() !==
                (profile?.email ?? "").toLowerCase() ? (
                  <PasswordInput
                    label="Senha atual"
                    description="Necessária para confirmar a troca de e-mail"
                    placeholder="Sua senha atual"
                    required
                    {...profileForm.getInputProps("currentPassword")}
                  />
                ) : null}
                <TextInput
                  label="CPF"
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={CPF_FORMATTED_MAX_LENGTH}
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
          ) : displayedFavorites.length > 0 ? (
            <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
              {displayedFavorites.map((event) => (
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
                    {PASSWORD_REQUIREMENTS_HINT}
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
