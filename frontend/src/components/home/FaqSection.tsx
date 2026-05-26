import { Accordion, Stack, Text, Title } from "@mantine/core";

const FAQ_ITEMS = [
  {
    question: "Como cancelo ou peço reembolso de um ingresso?",
    answer:
      "Entre em contato com o produtor do evento ou com nosso suporte em até 7 dias após a compra, conforme o Código de Defesa do Consumidor. Reembolsos de pedidos elegíveis são processados pelo painel administrativo.",
  },
  {
    question: "Onde encontro meus ingressos após a compra?",
    answer:
      "Após a confirmação do pagamento PIX, seus ingressos ficam disponíveis em Meus ingressos, com QR code para entrada no evento.",
  },
  {
    question: "Posso transferir meu ingresso para outra pessoa?",
    answer:
      "Cada ingresso é nominal. Para transferências, consulte a política do evento ou entre em contato com o produtor antes do check-in.",
  },
  {
    question: "Quanto tempo tenho para pagar após reservar?",
    answer:
      "A reserva fica válida por 15 minutos. Se o PIX não for pago nesse prazo, os ingressos voltam automaticamente para o estoque.",
  },
  {
    question: "Não consigo acessar minha conta. O que faço?",
    answer:
      "Verifique se o e-mail está correto e tente entrar novamente. Se o problema persistir, cadastre-se com outro e-mail ou fale com o suporte.",
  },
] as const;

export function FaqSection() {
  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={2} size="h3">
          Tire suas dúvidas
        </Title>
        <Text c="dimmed">Respostas rápidas sobre compra, ingressos e conta.</Text>
      </Stack>

      <Accordion
        variant="separated"
        radius="md"
        chevronPosition="right"
        classNames={{ item: "faq-item" }}
      >
        {FAQ_ITEMS.map((item) => (
          <Accordion.Item key={item.question} value={item.question}>
            <Accordion.Control fw={600}>{item.question}</Accordion.Control>
            <Accordion.Panel c="dimmed">{item.answer}</Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Stack>
  );
}
