/**
 * @file Painel de pagamento via cartão de crédito com tokenização Mercado Pago.
 * @module components/CardPaymentPanel
 *
 * O formulário captura os dados do cartão apenas no navegador, gera o `card_token`
 * com o SDK oficial do Mercado Pago e envia ao back-end somente o token,
 * a bandeira (`payment_method_id`), o número de parcelas e os dados do pagador.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { IconAlertCircle, IconCreditCard, IconLock } from "@tabler/icons-react";
import { PremiumPaper } from "./account/PremiumPaper";
import { useMercadoPago } from "../hooks/useMercadoPago";
import { formatCurrencyFromCents } from "../utils/format";
import type { CardPaymentPayload } from "../features/sales/api/purchaseService";

/** Propriedades do painel de pagamento via cartão. */
interface CardPaymentPanelProps {
  /** Valor total em centavos (usado para parcelas e exibição). */
  amountCents: number;
  /** E-mail do pagador pré-preenchido (usuário autenticado). */
  defaultEmail?: string;
  /** Indica envio em andamento ao back-end. */
  submitting: boolean;
  /** Recebe os dados tokenizados prontos para o back-end. */
  onSubmit: (payload: Omit<CardPaymentPayload, "orderId">) => void;
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function formatCardNumber(value: string): string {
  return onlyDigits(value)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();
}

function formatExpiration(value: string): string {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatCpf(value: string): string {
  return onlyDigits(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/**
 * Formulário seguro de cartão de crédito que tokeniza via Mercado Pago.
 */
export function CardPaymentPanel({
  amountCents,
  defaultEmail,
  submitting,
  onSubmit,
}: CardPaymentPanelProps) {
  const mp = useMercadoPago();

  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expiration, setExpiration] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [installments, setInstallments] = useState("1");
  const [installmentOptions, setInstallmentOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "1", label: "1x sem juros" }]);

  const [tokenizing, setTokenizing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const bin = useMemo(() => onlyDigits(cardNumber).slice(0, 8), [cardNumber]);

  useEffect(() => {
    setEmail((current) => current || defaultEmail || "");
  }, [defaultEmail]);

  useEffect(() => {
    if (!mp.ready || bin.length < 6) {
      return;
    }

    let cancelled = false;

    mp.fetchInstallments(amountCents / 100, bin).then((options) => {
      if (cancelled || options.length === 0) {
        return;
      }
      setInstallmentOptions(
        options.map((option) => ({
          value: String(option.installments),
          label: option.label,
        })),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [mp, bin, amountCents]);

  const handleSubmit = async () => {
    setFormError(null);

    const digitsCard = onlyDigits(cardNumber);
    const [expMonth, expYear] = expiration.split("/");

    if (digitsCard.length < 13) {
      setFormError("Número do cartão inválido.");
      return;
    }
    if (!cardholderName.trim()) {
      setFormError("Informe o nome do titular.");
      return;
    }
    if (!expMonth || !expYear || expMonth.length !== 2 || expYear.length !== 2) {
      setFormError("Data de expiração inválida (MM/AA).");
      return;
    }
    if (securityCode.length < 3) {
      setFormError("Código de segurança (CVV) inválido.");
      return;
    }
    if (onlyDigits(document).length < 11) {
      setFormError("CPF inválido.");
      return;
    }

    setTokenizing(true);

    try {
      const token = await mp.createCardToken({
        cardNumber: digitsCard,
        cardholderName: cardholderName.trim(),
        cardExpirationMonth: expMonth,
        cardExpirationYear: `20${expYear}`,
        securityCode,
        identificationType: "CPF",
        identificationNumber: onlyDigits(document),
      });

      const paymentMethodId = await mp.detectPaymentMethodId(bin);

      if (!paymentMethodId) {
        setFormError("Não foi possível identificar a bandeira do cartão.");
        return;
      }

      onSubmit({
        token,
        paymentMethodId,
        installments: Number(installments),
        payerEmail: email.trim() || undefined,
        payerDocument: onlyDigits(document),
      });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível processar o cartão. Verifique os dados.",
      );
    } finally {
      setTokenizing(false);
    }
  };

  if (mp.loading) {
    return (
      <PremiumPaper p="xl" className="pix-payment-panel" aria-busy="true">
        <Center py="xl">
          <Stack gap="sm" align="center">
            <Loader size="md" color="brand" />
            <Text size="sm" c="dimmed">
              Carregando pagamento seguro...
            </Text>
          </Stack>
        </Center>
      </PremiumPaper>
    );
  }

  if (!mp.available) {
    return (
      <PremiumPaper p="xl" className="pix-payment-panel">
        <Alert color="orange" variant="light" radius="lg" icon={<IconAlertCircle size={18} />}>
          Pagamento com cartão indisponível. Adicione{" "}
          <Text span ff="monospace" fw={600}>
            MERCADOPAGO_PUBLIC_KEY
          </Text>{" "}
          no{" "}
          <Text span ff="monospace" fw={600}>
            backend/.env
          </Text>{" "}
          (painel MP → Credenciais de teste → Public Key) e use{" "}
          <Text span ff="monospace" fw={600}>
            PAYMENT_GATEWAY=mercadopago
          </Text>
          .
        </Alert>
      </PremiumPaper>
    );
  }

  const busy = tokenizing || submitting;

  return (
    <PremiumPaper p="xl" className="pix-payment-panel">
      <Stack gap="lg">
        <Group gap="sm" align="flex-start">
          <ThemeIcon size={48} radius="xl" variant="light" color="brand">
            <IconCreditCard size={24} />
          </ThemeIcon>
          <Stack gap={4}>
            <Text fw={700} size="lg">
              Pague com cartão de crédito
            </Text>
            <Text c="dimmed" size="sm" style={{ lineHeight: 1.55 }}>
              Seus dados são protegidos e enviados diretamente ao Mercado Pago.
            </Text>
          </Stack>
        </Group>

        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Stack gap={2}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Valor a pagar
            </Text>
            <Text className="order-total-value" c="brand">
              {formatCurrencyFromCents(amountCents)}
            </Text>
          </Stack>
        </Group>

        <TextInput
          label="Número do cartão"
          placeholder="0000 0000 0000 0000"
          value={cardNumber}
          onChange={(event) => setCardNumber(formatCardNumber(event.currentTarget.value))}
          inputMode="numeric"
          autoComplete="cc-number"
          radius="md"
        />

        <TextInput
          label="Nome do titular"
          placeholder="Como impresso no cartão"
          value={cardholderName}
          onChange={(event) => setCardholderName(event.currentTarget.value)}
          autoComplete="cc-name"
          radius="md"
        />

        <Group grow>
          <TextInput
            label="Validade (MM/AA)"
            placeholder="MM/AA"
            value={expiration}
            onChange={(event) => setExpiration(formatExpiration(event.currentTarget.value))}
            inputMode="numeric"
            autoComplete="cc-exp"
            radius="md"
          />
          <TextInput
            label="CVV"
            placeholder="123"
            value={securityCode}
            onChange={(event) =>
              setSecurityCode(onlyDigits(event.currentTarget.value).slice(0, 4))
            }
            inputMode="numeric"
            autoComplete="cc-csc"
            radius="md"
          />
        </Group>

        <Group grow>
          <TextInput
            label="CPF do titular"
            placeholder="000.000.000-00"
            value={document}
            onChange={(event) => setDocument(formatCpf(event.currentTarget.value))}
            inputMode="numeric"
            radius="md"
          />
          <TextInput
            label="E-mail"
            placeholder="voce@email.com"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            type="email"
            autoComplete="email"
            radius="md"
          />
        </Group>

        <Select
          label="Parcelas"
          data={installmentOptions}
          value={installments}
          onChange={(value) => setInstallments(value ?? "1")}
          allowDeselect={false}
          radius="md"
          comboboxProps={{ withinPortal: true }}
        />

        {formError ? (
          <Alert color="red" variant="light" radius="lg" icon={<IconAlertCircle size={18} />}>
            {formError}
          </Alert>
        ) : null}

        <Button
          fullWidth
          size="lg"
          radius="xl"
          loading={busy}
          disabled={!mp.ready}
          leftSection={<IconLock size={18} />}
          onClick={() => void handleSubmit()}
        >
          {mp.ready
            ? `Pagar ${formatCurrencyFromCents(amountCents)}`
            : "Carregando pagamento seguro..."}
        </Button>

        <Group gap={6} c="dimmed" justify="center">
          <IconLock size={14} />
          <Text size="xs">Pagamento processado com segurança pelo Mercado Pago.</Text>
        </Group>
      </Stack>
    </PremiumPaper>
  );
}
