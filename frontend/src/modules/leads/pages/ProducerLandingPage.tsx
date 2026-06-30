import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Accordion, Button, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconArrowRight,
  IconChartBar,
  IconCircleCheck,
  IconCoin,
  IconLock,
  IconPlayerPlay,
  IconRocket,
} from "@tabler/icons-react";
import { submitProducerContact } from "@/modules/leads/api/leadService";
import { AnimatedSection } from "@/components/home/AnimatedSection";
import { SiteFooter } from "@/components/home/SiteFooter";
import { ZeMascot } from "@/components/brand/ZeMascot";
import "@/styles/producer-landing.css";

function useCountUp(end: number, decimals = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true);
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let t0: number | null = null;
    const tick = (ts: number) => {
      if (t0 === null) t0 = ts;
      const p = Math.min((ts - t0) / 1800, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const factor = Math.pow(10, decimals);
      setCount(Math.round(eased * end * factor) / factor);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, end, decimals]);

  const display =
    decimals > 0 ? count.toFixed(decimals) : String(Math.floor(count));
  return { display, ref };
}

function CounterItem({
  end,
  prefix = "",
  accentPrefix = "",
  suffix = "",
  decimals = 0,
  label,
}: {
  end: number;
  prefix?: string;
  accentPrefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
}) {
  const { display, ref } = useCountUp(end, decimals);
  return (
    <div className="producer-counter-item" ref={ref}>
      <span className="producer-counter-value">
        {prefix}
        <span>{accentPrefix}{display}{suffix}</span>
      </span>
      <span className="producer-counter-label">{label}</span>
    </div>
  );
}

function FeatureItem({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ size?: number; stroke?: number }>;
  title: string;
  body: string;
}) {
  return (
    <div className="producer-feature-item">
      <div className="producer-feature-icon">
        <Icon size={20} stroke={1.5} />
      </div>
      <div className="producer-feature-text">
        <p className="producer-feature-title">{title}</p>
        <p className="producer-feature-body">{body}</p>
      </div>
    </div>
  );
}

function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      name: "",
      email: "",
      phone: "",
    },
    validate: {
      name: (value) =>
        value.trim().length >= 2 ? null : "Informe seu nome completo",
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value.trim()) ? null : "Informe um e-mail válido",
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      await submitProducerContact({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || undefined,
      });
      setSubmitted(true);
    } catch {
      setError("Não foi possível enviar sua mensagem. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  });

  if (submitted) {
    return (
      <div className="producer-contact-success">
        <IconCircleCheck
          size={44}
          color="var(--vibra-v)"
          style={{ marginBottom: "1rem" }}
        />
        <p
          style={{
            fontFamily: "var(--vibra-font-display)",
            fontSize: "1.25rem",
            fontWeight: 700,
            margin: "0 0 0.5rem",
            color: "var(--mantine-color-text)",
          }}
        >
          Mensagem recebida!
        </p>
        <p style={{ color: "var(--mantine-color-dimmed)", margin: 0, fontSize: "0.9rem" }}>
          Nossa equipe vai entrar em contato em até 1 dia útil.
        </p>
      </div>
    );
  }

  return (
    <form className="producer-contact-form" onSubmit={handleSubmit} noValidate>
      <TextInput
        label="Nome"
        placeholder="Seu nome completo"
        required
        radius="md"
        size="md"
        name="name"
        autoComplete="name"
        {...form.getInputProps("name")}
      />
      <TextInput
        label="E-mail"
        placeholder="seu@email.com"
        type="email"
        required
        radius="md"
        size="md"
        name="email"
        autoComplete="email"
        {...form.getInputProps("email")}
      />
      <TextInput
        label="Telefone"
        placeholder="(11) 99999-9999"
        type="tel"
        radius="md"
        size="md"
        name="phone"
        autoComplete="tel"
        {...form.getInputProps("phone")}
      />
      <Button
        type="submit"
        size="md"
        radius="md"
        fullWidth
        loading={loading}
        rightSection={<IconArrowRight size={16} />}
        style={{ marginTop: "0.5rem" }}
      >
        Entrar em contato
      </Button>
      {error && (
        <p style={{ color: "var(--mantine-color-red-6)", margin: "0.75rem 0 0", fontSize: "0.875rem" }}>
          {error}
        </p>
      )}
    </form>
  );
}

const FEATURES = [
  {
    icon: IconCoin,
    title: "Taxa de 8% — ponto final.",
    body: "Sem adesão, mensalidade ou surpresa na fatura. Enquanto o mercado cobra entre 10% e 12%, você fica com mais do que é seu e sabe exatamente o que paga.",
  },
  {
    icon: IconChartBar,
    title: "Dashboard ao vivo.",
    body: "Vendas, ingressos e ticket médio em tempo real. Não é só relatório: é um painel que ajuda você a tomar decisões antes do show acontecer.",
  },
  {
    icon: IconLock,
    title: "Ingresso anti-fraude.",
    body: "QR codes dinâmicos e nominais impossibilitam a revenda. Valide entradas em tempo real direto pelo app — sem nenhum equipamento extra.",
  },
] as const;

const STEPS = [
  {
    number: "01",
    title: "Crie sua conta em minutos",
    body: "Cadastre-se, configure seu perfil de produtor e tenha acesso imediato ao painel. Zero burocracia para começar.",
  },
  {
    number: "02",
    title: "Publique seu evento",
    body: "Crie lotes, defina preços, suba a arte do evento e coloque à venda. Do rascunho ao link em menos de 10 minutos.",
  },
  {
    number: "03",
    title: "Venda, analise, repita",
    body: "Acompanhe vendas em tempo real, conheça seu público com dados reais e receba em D+3 direto na sua conta.",
  },
] as const;

const FAQ_ITEMS = [
  {
    question: "Quanto a VIBRA cobra por ingresso?",
    answer:
      "Nossa taxa é de 8% sobre o valor do ingresso — transparente, sem taxas escondidas. Para comparar: as principais plataformas do mercado cobram entre 10% e 12%, mais taxas adicionais.",
  },
  {
    question: "Quando recebo o dinheiro das vendas?",
    answer:
      "Os repasses são feitos em D+3 após cada venda confirmada via PIX. Enquanto outras plataformas fazem o pagamento só depois do evento (D+30), você recebe o fluxo de caixa na semana seguinte à compra.",
  },
  {
    question: "Os ingressos são protegidos contra cambistas?",
    answer:
      "Sim. Os QR codes são dinâmicos e nominais, o que impossibilita a revenda ou duplicação de ingressos. Cada ingresso é vinculado a um CPF e não pode ser transferido sem autorização do produtor.",
  },
  {
    question: "Posso usar a VIBRA para eventos de qualquer porte?",
    answer:
      "Sim. A plataforma foi construída para escalar desde shows intimistas com 50 pessoas até grandes festivais com múltiplos lotes e setores. O sistema se adapta ao tamanho do seu evento.",
  },
] as const;

export function ProducerLandingPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="producer-hero">
        <div className="producer-hero-inner">
          <AnimatedSection>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <span className="producer-hero-kicker">
                <IconRocket size={12} />
                Para produtores
              </span>
            </div>

            <h1 className="producer-hero-title">
              Sua plataforma.{" "}
              <span className="producer-hero-accent">Suas regras.</span>
              <br />
              Sua receita.
            </h1>

            <p className="producer-hero-lead">
              Ferramentas de verdade para quem vive de shows — taxa justa, pagamento rápido,
              dashboard ao vivo e um público que já ama música.
            </p>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Button
                component={Link}
                to="/cadastro"
                size="lg"
                radius="xl"
                className="landing-pill-cta"
                rightSection={<IconArrowRight size={18} />}
              >
                Criar conta grátis
              </Button>
              <Button
                component={Link}
                to="/login"
                size="lg"
                radius="xl"
                variant="subtle"
                color="gray"
              >
                Já tenho conta
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Counters ── */}
      <div className="producer-counters">
        <div className="producer-counters-inner">
          <CounterItem
            end={8}
            accentPrefix=""
            suffix="%"
            label="Taxa — abaixo dos 10–12% do mercado"
          />
          <CounterItem
            end={3}
            prefix="D"
            accentPrefix="+"
            label="Recebimento após cada venda confirmada"
          />
          <CounterItem
            end={87}
            suffix="%"
            label="Taxa de recompra de fãs na plataforma"
          />
          <CounterItem
            end={4.9}
            suffix="★"
            decimals={1}
            label="Satisfação média dos compradores"
          />
        </div>
      </div>

      {/* ── Features ── */}
      <AnimatedSection delayMs={40}>
        <section className="producer-features-section">
          <div className="producer-features-split">
            <div>
              <div className="producer-features-heading">
                <h2 className="producer-features-title">
                  Construído para quem vive de shows.
                </h2>
                <p className="producer-features-sub">
                  Não é só uma ticketeira. É uma ferramenta que trabalha por você
                  antes, durante e depois do evento.
                </p>
              </div>
              <div className="producer-features-list">
                {FEATURES.map((f) => (
                  <FeatureItem key={f.title} icon={f.icon} title={f.title} body={f.body} />
                ))}
              </div>
            </div>

            <div className="producer-features-video">
              <div className="producer-features-video-icon">
                <IconPlayerPlay size={22} stroke={1.5} />
              </div>
              <span className="producer-features-video-label">Vídeo em breve</span>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ── How it works ── */}
      <AnimatedSection delayMs={40}>
        <div className="producer-steps-section">
          <div className="producer-steps-inner">
            <div className="producer-steps-heading">
              <h2 className="producer-steps-title">Como funciona</h2>
              <p className="producer-steps-sub">
                Do cadastro ao primeiro ingresso vendido em menos de 10 minutos.
              </p>
            </div>
            <div className="producer-steps-grid">
              {STEPS.map((step) => (
                <div key={step.number} className="producer-step-card">
                  <span className="producer-step-number">{step.number}</span>
                  <p className="producer-step-title">{step.title}</p>
                  <p className="producer-step-body">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ── FAQ ── */}
      <AnimatedSection delayMs={40}>
        <section className="producer-features-section">
          <div className="producer-features-heading">
            <h2 className="producer-features-title">Perguntas frequentes</h2>
          </div>
          <Accordion
            variant="separated"
            radius="lg"
            chevronPosition="right"
            classNames={{ item: "faq-item home-faq-item" }}
          >
            {FAQ_ITEMS.map((item) => (
              <Accordion.Item key={item.question} value={item.question}>
                <Accordion.Control fw={600}>{item.question}</Accordion.Control>
                <Accordion.Panel c="dimmed" style={{ lineHeight: 1.65 }}>
                  {item.answer}
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </section>
      </AnimatedSection>

      {/* ── Contact ── */}
      <AnimatedSection delayMs={40}>
        <section
          className="producer-contact-section"
          style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
        >
          <div className="producer-contact-inner">
            <div className="producer-contact-mascot" aria-hidden="true">
              <ZeMascot size={80} animated variant="dark" />
            </div>
            <div className="producer-contact-heading">
              <h2 className="producer-contact-title">Fale com a gente.</h2>
              <p className="producer-contact-sub">
                Quer saber mais sobre como a VIBRA pode ajudar sua produtora?
                Deixe seu contato e entramos em contato em até 1 dia útil.
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
      </AnimatedSection>

      <SiteFooter />
    </>
  );
}
