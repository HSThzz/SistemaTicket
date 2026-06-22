/**
 * @file Painel administrativo: suporte (busca/reembolso) e plataforma (papéis, estoque, auditoria).
 * @module pages/admin/AdminDashboardPage
 */

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Divider,
  Grid,
  Group,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconDatabase,
  IconHistory,
  IconReceiptRefund,
  IconRefresh,
  IconSearch,
  IconShield,
  IconUser,
  IconUserCog,
} from "@tabler/icons-react";
import { AnimatedSection } from "../../components/home/AnimatedSection";
import { EmptyState } from "../../components/account/EmptyState";
import { PageHeader } from "../../components/account/PageHeader";
import { StatCard } from "../../components/account/StatCard";
import { AdminNav, type AdminTab } from "../../components/admin/AdminNav";
import { AdminIssueTicketsPanel } from "../../components/admin/AdminIssueTicketsPanel";
import { AdminSection } from "../../components/admin/AdminSection";
import { AdminAuditLogList } from "../../components/admin/AdminAuditLogList";
import * as authService from "../../features/identity/api/authService";
import * as orderService from "../../features/sales/api/orderService";
import * as purchaseService from "../../features/sales/api/purchaseService";
import { useAuth } from "../../context/AuthContext";
import type {
  AdminAuditLogEntry,
  AuthUser,
  OrderAdminDetails,
  StockReconciliationReport,
  UserRole,
} from "../../types/api";
import { formatCurrencyFromCents } from "../../utils/format";
import { getApiErrorMessage } from "../../utils/errors";
import { getOrderStatusLabel } from "../../utils/statusLabels";
import {
  ASSIGNABLE_ROLE_OPTIONS,
  getRoleBadgeColor,
  isSuperAdmin,
  ROLE_LABELS,
} from "../../utils/adminRoles";

/**
 * Dashboard admin com abas de suporte e plataforma (super admin).
 */
export function AdminDashboardPage() {
  const { user: currentUser } = useAuth();
  const canManagePlatform = isSuperAdmin(currentUser?.role);
  const isMobile = useMediaQuery("(max-width: 47.99em)");
  const [activeTab, setActiveTab] = useState<AdminTab>("support");

  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  const [roleSaving, setRoleSaving] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [roleConfirmOpened, { open: openRoleConfirm, close: closeRoleConfirm }] =
    useDisclosure(false);

  const [orderId, setOrderId] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderAdminDetails | null>(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundConfirmOpened, { open: openRefundConfirm, close: closeRefundConfirm }] =
    useDisclosure(false);

  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [reconcileReport, setReconcileReport] =
    useState<StockReconciliationReport | null>(null);

  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogEntry[]>([]);

  const userForm = useForm({
    initialValues: { email: "" },
    validate: {
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value.trim()) ? null : "E-mail inválido",
    },
  });

  const overview = useMemo(() => {
    const roleLabel = currentUser?.role ? ROLE_LABELS[currentUser.role] : "—";

    return {
      roleLabel,
      auditCount: auditLogs.length,
      lastReconcile:
        reconcileReport != null
          ? `${reconcileReport.correctedCount}/${reconcileReport.lotsChecked}`
          : "—",
    };
  }, [auditLogs.length, currentUser?.role, reconcileReport]);

  const loadAuditLogs = async () => {
    if (!canManagePlatform) return;

    setAuditLoading(true);
    setAuditError(null);

    try {
      const logs = await authService.listAdminAuditLogs(50);
      setAuditLogs(logs);
    } catch (err) {
      setAuditError(getApiErrorMessage(err, "Não foi possível carregar o histórico."));
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (canManagePlatform) {
      void loadAuditLogs();
    }
  }, [canManagePlatform]);

  const handleLookupUser = userForm.onSubmit(async (values) => {
    setLookupLoading(true);
    setLookupError(null);
    setSelectedUser(null);

    try {
      const user = await authService.lookupUserByEmail(values.email.trim());
      setSelectedUser(user);
    } catch (err) {
      setLookupError(getApiErrorMessage(err, "Usuário não encontrado."));
    } finally {
      setLookupLoading(false);
    }
  });

  const handleRoleSelect = (role: UserRole | null) => {
    if (!selectedUser || !role || role === selectedUser.role) return;
    setPendingRole(role);
    openRoleConfirm();
  };

  const handleConfirmRoleChange = async () => {
    if (!selectedUser || !pendingRole) return;

    setRoleSaving(true);
    try {
      const updated = await authService.updateUserRole(selectedUser.id, pendingRole);
      setSelectedUser(updated);
      notifications.show({
        title: "Papel atualizado",
        message: `${updated.email} agora é ${ROLE_LABELS[pendingRole]}.`,
        color: "green",
      });
      closeRoleConfirm();
      setPendingRole(null);
      void loadAuditLogs();
    } catch (err) {
      notifications.show({
        title: "Erro",
        message: getApiErrorMessage(err, "Não foi possível alterar o papel."),
        color: "red",
      });
    } finally {
      setRoleSaving(false);
    }
  };

  const handleLookupOrder = async () => {
    const id = orderId.trim();
    if (!id) {
      setOrderError("Informe o ID do pedido.");
      return;
    }

    setOrderLoading(true);
    setOrderError(null);
    setOrderDetails(null);

    try {
      const order = await orderService.getOrderByIdAdmin(id);
      setOrderDetails(order);
    } catch (err) {
      setOrderError(getApiErrorMessage(err, "Pedido não encontrado."));
    } finally {
      setOrderLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!orderDetails) return;

    setRefundLoading(true);
    try {
      const result = await orderService.refundOrder(orderDetails.id);
      notifications.show({
        title: "Reembolso processado",
        message: `${result.ticketsCancelled} ingresso(s) cancelado(s); estoque +${result.stockRestored}.`,
        color: "green",
      });
      const refreshed = await orderService.getOrderByIdAdmin(orderDetails.id);
      setOrderDetails(refreshed);
      closeRefundConfirm();
      if (canManagePlatform) {
        void loadAuditLogs();
      }
    } catch (err) {
      notifications.show({
        title: "Reembolso falhou",
        message: getApiErrorMessage(err, "Não foi possível reembolsar o pedido."),
        color: "red",
      });
    } finally {
      setRefundLoading(false);
    }
  };

  const handleReconcileStock = async () => {
    setReconcileLoading(true);
    try {
      const report = await purchaseService.reconcileStock();
      setReconcileReport(report);
      notifications.show({
        title: "Estoque verificado",
        message: `${report.correctedCount} lote(s) corrigido(s) de ${report.lotsChecked} verificados.`,
        color: report.correctedCount > 0 ? "yellow" : "green",
      });
      void loadAuditLogs();
    } catch (err) {
      notifications.show({
        title: "Falha na verificação",
        message: getApiErrorMessage(err, "Não foi possível verificar o estoque."),
        color: "red",
      });
    } finally {
      setReconcileLoading(false);
    }
  };

  const supportPanel = (
    <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg">
      <AdminSection
        icon={IconUserCog}
        iconColor="blue"
        title="Buscar usuário"
        description="Localize uma conta pelo e-mail para consultar dados ou alterar o papel."
      >
        <form onSubmit={handleLookupUser}>
          <Grid align="flex-end" gap="md">
            <Grid.Col span={{ base: 12, sm: 8 }}>
              <TextInput
                label="E-mail"
                placeholder="cliente@exemplo.com"
                {...userForm.getInputProps("email")}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Button
                type="submit"
                fullWidth
                loading={lookupLoading}
                leftSection={<IconSearch size={16} />}
              >
                Buscar
              </Button>
            </Grid.Col>
          </Grid>
        </form>

        {lookupError ? (
          <Alert
            mt="md"
            color="red"
            variant="light"
            icon={<IconAlertCircle size={16} />}
            title="Usuário não encontrado"
            radius="lg"
          >
            {lookupError}
          </Alert>
        ) : null}

        {selectedUser ? (
          <Paper className="admin-result-card" p="md" radius="lg" mt="lg" withBorder>
            <Stack gap="md" className="admin-result-header">
              <Group gap="md" wrap="wrap" align="flex-start" className="admin-result-identity">
                <ThemeIcon size={48} radius="xl" variant="light" color="blue">
                  <IconUser size={24} />
                </ThemeIcon>
                <Stack gap={4} className="admin-result-copy">
                  <Text fw={700} size="lg" lineClamp={2}>
                    {selectedUser.name}
                  </Text>
                  <Text size="sm" c="dimmed" className="admin-result-email">
                    {selectedUser.email}
                  </Text>
                  <Text size="xs" c="dimmed" className="admin-mono-id">
                    {selectedUser.id}
                  </Text>
                </Stack>
              </Group>
              <Badge
                size="lg"
                variant="light"
                color={getRoleBadgeColor(selectedUser.role)}
                className="admin-result-badge"
              >
                {ROLE_LABELS[selectedUser.role]}
              </Badge>
            </Stack>

            <Divider my="md" />

            {canManagePlatform ? (
              <Select
                label="Alterar papel"
                description="Confirmação obrigatória antes de aplicar a mudança."
                data={ASSIGNABLE_ROLE_OPTIONS}
                value={selectedUser.role}
                allowDeselect={false}
                comboboxProps={{ withinPortal: true }}
                onChange={(value) => {
                  if (value) {
                    handleRoleSelect(value as UserRole);
                  }
                }}
                disabled={roleSaving}
              />
            ) : (
              <Alert color="blue" variant="light" radius="lg" title="Somente consulta">
                Administradores de suporte podem buscar usuários, mas não alterar papéis.
              </Alert>
            )}
          </Paper>
        ) : (
          <Box mt="lg">
            <EmptyState
              icon={<IconUser size={28} />}
              title="Nenhum usuário selecionado"
              description="Busque pelo e-mail para ver os dados da conta."
            />
          </Box>
        )}
      </AdminSection>

      <AdminSection
        icon={IconReceiptRefund}
        iconColor="red"
        title="Reembolsar pedido"
        description="Consulte um pedido pelo ID e processe o reembolso de pedidos pagos."
      >
        <Grid align="flex-end" gap="md">
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <TextInput
              label="ID do pedido"
              placeholder="UUID do pedido"
              value={orderId}
              onChange={(event) => setOrderId(event.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Button fullWidth loading={orderLoading} onClick={() => void handleLookupOrder()}>
              Consultar
            </Button>
          </Grid.Col>
        </Grid>

        {orderError ? (
          <Alert
            mt="md"
            color="red"
            variant="light"
            icon={<IconAlertCircle size={16} />}
            title="Pedido não encontrado"
            radius="lg"
          >
            {orderError}
          </Alert>
        ) : null}

        {orderDetails ? (
          <Paper className="admin-result-card" p="md" radius="lg" mt="lg" withBorder>
            <Stack gap="md" className="admin-result-header">
              <Stack gap={4} className="admin-result-copy">
                <Text fw={700} size="lg" lineClamp={2}>
                  {orderDetails.eventTitle ?? "Evento"}
                </Text>
                <Text size="sm" c="dimmed">
                  {orderDetails.userName}
                </Text>
                <Text size="sm" c="dimmed" className="admin-result-email">
                  {orderDetails.userEmail}
                </Text>
                <Text size="xs" c="dimmed" className="admin-mono-id">
                  {orderDetails.id}
                </Text>
              </Stack>
              <Badge
                size="lg"
                variant="light"
                color={orderDetails.status === "PAID" ? "green" : "gray"}
                className="admin-result-badge"
              >
                {getOrderStatusLabel(orderDetails.status)}
              </Badge>
            </Stack>

            <Divider my="md" />

            <Group
              justify="space-between"
              align="center"
              wrap="wrap"
              gap="md"
              className="admin-result-footer"
            >
              <Stack gap={2}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  Valor do pedido
                </Text>
                <Text className="admin-result-value">
                  {formatCurrencyFromCents(orderDetails.totalPrice)}
                </Text>
              </Stack>

              <Button
                color="red"
                variant="light"
                radius="xl"
                leftSection={<IconShield size={16} />}
                loading={refundLoading}
                disabled={orderDetails.status !== "PAID"}
                onClick={openRefundConfirm}
                className="admin-result-action"
                w={{ base: "100%", sm: "auto" }}
              >
                Reembolsar pedido
              </Button>
            </Group>

            {orderDetails.status !== "PAID" ? (
              <Text size="xs" c="dimmed" mt="sm">
                Apenas pedidos com status pago podem ser reembolsados.
              </Text>
            ) : null}
          </Paper>
        ) : (
          <Box mt="lg">
            <EmptyState
              icon={<IconReceiptRefund size={28} />}
              title="Nenhum pedido consultado"
              description="Informe o UUID do pedido para ver detalhes e reembolsar."
            />
          </Box>
        )}
      </AdminSection>
    </SimpleGrid>
  );

  const platformPanel = (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <AdminSection
          icon={IconDatabase}
          iconColor="teal"
          title="Verificar estoque"
          description="Ferramenta técnica que alinha o estoque rápido (Redis) com o banco de dados."
        >
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Use apenas quando houver suspeita de divergência entre o estoque exibido na
              compra e o estoque real do evento.
            </Text>

            <Button
              radius="xl"
              loading={reconcileLoading}
              leftSection={<IconRefresh size={16} />}
              onClick={() => void handleReconcileStock()}
              w={{ base: "100%", sm: "auto" }}
            >
              Executar verificação
            </Button>

            {reconcileReport ? (
              <Paper className="admin-result-card admin-result-card--compact" p="md" radius="lg" withBorder>
                <SimpleGrid cols={2} spacing="md">
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Lotes verificados
                    </Text>
                    <Text fw={700} size="lg">
                      {reconcileReport.lotsChecked}
                    </Text>
                  </Stack>
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Corrigidos
                    </Text>
                    <Text
                      fw={700}
                      size="lg"
                      c={reconcileReport.correctedCount > 0 ? "yellow.7" : "teal.7"}
                    >
                      {reconcileReport.correctedCount}
                    </Text>
                  </Stack>
                </SimpleGrid>
                <Text size="xs" c="dimmed" mt="sm">
                  Última execução:{" "}
                  {new Date(reconcileReport.checkedAt).toLocaleString("pt-BR")}
                </Text>
              </Paper>
            ) : null}
          </Stack>
        </AdminSection>

        <AdminSection
          icon={IconHistory}
          iconColor="grape"
          title="Resumo do histórico"
          description="Registro das ações sensíveis executadas pela equipe administrativa."
        >
          <Stack gap="sm">
            <Group justify="space-between" wrap="wrap">
              <Text size="sm" c="dimmed">
                Reembolsos, mudanças de papel e verificações de estoque ficam registrados aqui.
              </Text>
              <Badge variant="light" color="grape" size="lg">
                {auditLogs.length} registro(s)
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              O histórico completo aparece na tabela abaixo.
            </Text>
          </Stack>
        </AdminSection>
      </SimpleGrid>

      <AdminSection
        icon={IconHistory}
        iconColor="grape"
        title="Histórico de ações"
        className="admin-audit-section"
        action={
          <Button
            variant="light"
            radius="xl"
            size="sm"
            loading={auditLoading}
            leftSection={<IconRefresh size={14} />}
            onClick={() => void loadAuditLogs()}
          >
            Atualizar
          </Button>
        }
      >
        {auditError ? (
          <Alert
            color="red"
            variant="light"
            icon={<IconAlertCircle size={16} />}
            title="Histórico indisponível"
            radius="lg"
          >
            {auditError}
          </Alert>
        ) : null}

        {auditLoading && auditLogs.length === 0 ? (
          <Stack gap="sm">
            <Skeleton height={36} radius="md" />
            <Skeleton height={36} radius="md" />
            <Skeleton height={36} radius="md" />
          </Stack>
        ) : null}

        {!auditLoading && auditLogs.length === 0 ? (
          <EmptyState
            icon={<IconHistory size={28} />}
            title="Nenhuma ação registrada"
            description="Reembolsos, mudanças de papel, emissões manuais e verificações de estoque aparecerão aqui."
          />
        ) : null}

        {auditLogs.length > 0 ? (
          <AdminAuditLogList logs={auditLogs} />
        ) : null}
      </AdminSection>
    </Stack>
  );

  return (
    <Stack gap="lg" className="admin-dashboard">
      <AnimatedSection>
        <PageHeader
          icon={<IconShield size={28} color="var(--mantine-color-brand-6)" />}
          title="Painel de"
          highlight="administração" 
          description={
            canManagePlatform
              ? "Suporte ao cliente, emissão manual de ingressos e ferramentas da plataforma."
              : "Suporte ao cliente: consulta de usuários e reembolso de pedidos."
          }
        />
      </AnimatedSection>

      <AnimatedSection delayMs={20}>
        <AdminNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showPlatform={canManagePlatform}
        />
      </AnimatedSection>

      {canManagePlatform ? (
        <AnimatedSection delayMs={30}>
          <section className="admin-dashboard-kpis">
            <SimpleGrid cols={{ base: 2, md: 3 }} spacing="md">
              <StatCard
                label="Seu acesso"
                value={overview.roleLabel}
                icon={<IconShield size={20} />}
                iconColor="grape"
                valueColor="grape"
              />
              <StatCard
                label="Histórico"
                value={String(overview.auditCount)}
                icon={<IconHistory size={20} />}
                iconColor="blue"
                valueColor="blue"
              />
              <StatCard
                label="Última verif."
                value={overview.lastReconcile}
                icon={<IconDatabase size={20} />}
                iconColor="teal"
                valueColor="teal"
              />
            </SimpleGrid>
          </section>
        </AnimatedSection>
      ) : null}

      <AnimatedSection delayMs={40}>
        {activeTab === "support" || !canManagePlatform ? (
          supportPanel
        ) : activeTab === "issue" ? (
          <AdminIssueTicketsPanel onIssued={() => void loadAuditLogs()} />
        ) : (
          platformPanel
        )}
      </AnimatedSection>

      <Modal
        opened={refundConfirmOpened}
        onClose={closeRefundConfirm}
        title="Confirmar reembolso"
        centered={!isMobile}
        fullScreen={isMobile}
        radius="lg"
        classNames={{ title: "admin-modal-title" }}
      >
        <Stack gap="md" className="admin-modal-body">
          <Text size="sm">
            Reembolsar o pedido de{" "}
            <Text span fw={600}>
              {orderDetails?.userName}
            </Text>{" "}
            no valor de{" "}
            <Text span fw={600}>
              {orderDetails ? formatCurrencyFromCents(orderDetails.totalPrice) : "—"}
            </Text>
            ? Esta ação cancela os ingressos e restaura o estoque.
          </Text>
          <Stack gap="sm" className="admin-modal-actions">
            <Button
              color="red"
              radius="xl"
              loading={refundLoading}
              onClick={() => void handleRefund()}
              fullWidth
            >
              Confirmar reembolso
            </Button>
            <Button variant="default" radius="xl" onClick={closeRefundConfirm} fullWidth>
              Cancelar
            </Button>
          </Stack>
        </Stack>
      </Modal>

      <Modal
        opened={roleConfirmOpened}
        onClose={closeRoleConfirm}
        title="Confirmar alteração de papel"
        centered={!isMobile}
        fullScreen={isMobile}
        radius="lg"
        classNames={{ title: "admin-modal-title" }}
      >
        <Stack gap="md" className="admin-modal-body">
          <Text size="sm">
            Alterar o papel de{" "}
            <Text span fw={600}>
              {selectedUser?.email}
            </Text>{" "}
            de{" "}
            <Text span fw={600}>
              {selectedUser ? ROLE_LABELS[selectedUser.role] : "—"}
            </Text>{" "}
            para{" "}
            <Text span fw={600}>
              {pendingRole ? ROLE_LABELS[pendingRole] : "—"}
            </Text>
            ?
          </Text>
          <Stack gap="sm" className="admin-modal-actions">
            <Button
              radius="xl"
              loading={roleSaving}
              onClick={() => void handleConfirmRoleChange()}
              fullWidth
            >
              Confirmar
            </Button>
            <Button variant="default" radius="xl" onClick={closeRoleConfirm} fullWidth>
              Cancelar
            </Button>
          </Stack>
        </Stack>
      </Modal>
    </Stack>
  );
}
