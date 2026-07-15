/**
 * @file Textos legais da VIBRA (Termos de Uso e Política de Privacidade).
 * @module shared/legal/documents
 */

/** Versão vigente do aceite — deve bater com o backend no cadastro. */
export const LEGAL_DOCUMENTS_VERSION = "1.0";

export const LEGAL_DOCUMENTS_UPDATED_AT = "14 de julho de 2026";

export type LegalDocumentId = "terms" | "privacy";

export interface LegalSection {
  title: string;
  paragraphs: string[];
  /** Linhas de tabela opcional (ex.: categorias de dados). */
  table?: { headers: [string, string]; rows: [string, string][] };
}

export interface LegalDocument {
  id: LegalDocumentId;
  title: string;
  path: string;
  intro: string;
  sections: LegalSection[];
}

export const TERMS_OF_USE: LegalDocument = {
  id: "terms",
  title: "Termos de Uso",
  path: "/termos",
  intro:
    "Estes Termos regem o uso da plataforma VIBRA (vibraevents.com.br). Ao criar conta ou utilizar o serviço, você declara ter lido e concordado com este documento e com a Política de Privacidade.",
  sections: [
    {
      title: "1. Quem somos",
      paragraphs: [
        "A VIBRA é uma plataforma digital de divulgação e venda de ingressos para eventos. Nestes Termos, “você” é o usuário (cliente ou produtor) e “nós” / “VIBRA” é o operador da plataforma.",
        "Contato: contato@vibraevents.com.br.",
      ],
    },
    {
      title: "2. Aceite",
      paragraphs: [
        "Ao criar conta ou usar a plataforma, você declara ter lido e concordado com estes Termos e com a Política de Privacidade. Se não concordar, não utilize o serviço.",
      ],
    },
    {
      title: "3. Conta",
      paragraphs: [
        "O cadastro exige dados verdadeiros (nome, e-mail, CPF e senha).",
        "Você é responsável por manter a senha em sigilo e por atividades feitas na sua conta.",
        "Podemos suspender ou encerrar contas em caso de fraude, abuso, dados falsos ou violação destes Termos.",
      ],
    },
    {
      title: "4. Papel da VIBRA e do produtor",
      paragraphs: [
        "A VIBRA intermedia a venda de ingressos e a experiência digital (conta, pagamento, emissão, carteira de ingressos e check-in, quando aplicável).",
        "O produtor do evento é responsável pelo evento em si (realização, local, programação, regras de acesso, cancelamento do evento e política específica do ingresso, quando houver).",
        "Informações do evento (data, local, descrição, regras) são de responsabilidade do produtor; a VIBRA pode remover conteúdo inadequado ou ilegal.",
      ],
    },
    {
      title: "5. Compra de ingressos",
      paragraphs: [
        "A compra depende de disponibilidade de estoque e confirmação do pagamento.",
        "Ao iniciar a compra, pode haver reserva temporária (cerca de 15 minutos). Sem pagamento no prazo, a reserva expira e os ingressos voltam ao estoque.",
        "Formas de pagamento disponíveis na plataforma (ex.: PIX) seguem as regras do meio de pagamento e do provedor utilizado.",
        "O ingresso é, em regra, nominal. Transferência para outra pessoa depende da política do evento/produtor e deve ser solicitada antes do check-in.",
      ],
    },
    {
      title: "6. Ingressos digitais",
      paragraphs: [
        "Após a confirmação do pagamento, os ingressos ficam disponíveis em Meus ingressos, com QR code (e, quando habilitado, carteiras digitais).",
        "Apresente o ingresso válido no acesso; uso indevido, duplicação ou tentativa de fraude pode invalidar o ingresso.",
      ],
    },
    {
      title: "7. Cancelamentos e reembolsos",
      paragraphs: [
        "Pedidos elegíveis (em geral: sem check-in) podem ser reembolsados pelo painel do produtor ou pela equipe da VIBRA, conforme o caso.",
        "O valor tende a retornar pela mesma forma de pagamento usada na compra, nos prazos do meio de pagamento.",
        "Cancelamento do evento, mudança de data/local ou regras extras seguem a política do produtor e a legislação aplicável; a VIBRA pode apoiar a operação (ex.: estorno), sem assumir a realização do evento.",
      ],
    },
    {
      title: "8. Condutas proibidas",
      paragraphs: [
        "É vedado, entre outros: fraudar pagamento ou ingresso; revender de forma irregular quando proibido; automatizar abuso da plataforma; tentar acessar contas ou sistemas sem autorização; usar a plataforma para fins ilícitos.",
      ],
    },
    {
      title: "9. Disponibilidade e alterações",
      paragraphs: [
        "Buscamos manter o serviço disponível, mas podem ocorrer interrupções por manutenção, falhas técnicas ou de terceiros (pagamento, e-mail, nuvem etc.).",
        "Podemos alterar funcionalidades e estes Termos. Mudanças relevantes podem ser comunicadas na plataforma ou por e-mail. O uso contínuo após a vigência implica aceite da nova versão, salvo exigência legal em contrário.",
      ],
    },
    {
      title: "10. Limitação de responsabilidade",
      paragraphs: [
        "Na medida permitida pela lei, a VIBRA não se responsabiliza por danos decorrentes de: (a) falha ou cancelamento do evento pelo produtor; (b) uso indevido da sua conta; (c) indisponibilidade de serviços de terceiros; (d) decisões do usuário baseadas em informações do produtor.",
        "Nada nestes Termos limita direitos do consumidor que não possam ser afastados.",
      ],
    },
    {
      title: "11. Lei e foro",
      paragraphs: [
        "Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do domicílio do usuário consumidor, quando aplicável, ou o foro da comarca da sede da VIBRA, quando não houver regra especial.",
      ],
    },
  ],
};

export const PRIVACY_POLICY: LegalDocument = {
  id: "privacy",
  title: "Política de Privacidade",
  path: "/privacidade",
  intro:
    "Esta Política explica como tratamos dados pessoais na plataforma VIBRA (vibraevents.com.br), em conformidade com a LGPD (Lei nº 13.709/2018) e demais normas aplicáveis. Contato de privacidade: contato@vibraevents.com.br.",
  sections: [
    {
      title: "1. Escopo",
      paragraphs: [
        "Esta Política se aplica ao uso da plataforma VIBRA, incluindo cadastro, compra de ingressos, área do produtor e comunicações operacionais.",
      ],
    },
    {
      title: "2. Dados que coletamos",
      paragraphs: [
        "Conforme o uso do serviço, podemos tratar as categorias abaixo. Não pedimos dados sensíveis além do necessário à operação. O CPF é usado para identificação da conta, anti-fraude e exigências do pagamento.",
      ],
      table: {
        headers: ["Categoria", "Exemplos"],
        rows: [
          ["Cadastro / conta", "Nome, e-mail, CPF, senha (hash)"],
          ["Perfil e preferências", "Favoritos e dados atualizados por você"],
          [
            "Compra e pagamento",
            "Pedidos, status de pagamento, documento do pagador quando exigido",
          ],
          ["Ingressos", "Dados do ingresso, QR code, status de check-in"],
          [
            "Comunicações",
            "E-mails transacionais (confirmação, senha, reembolso etc.)",
          ],
          [
            "Técnicos",
            "Logs de acesso, IP, sessão, dados de segurança e antifraude",
          ],
          [
            "Integrações",
            "Dados mínimos de serviços vinculados, se você conectar",
          ],
        ],
      },
    },
    {
      title: "3. Para que usamos",
      paragraphs: [
        "Criar e autenticar sua conta; processar reservas, pagamentos e emissão de ingressos; permitir acesso ao evento (check-in) e gestão pelo produtor, quando aplicável; enviar comunicações operacionais; prevenir fraude e abusos; cumprir obrigações legais; e melhorar o serviço (métricas agregadas / diagnóstico técnico).",
        "Bases legais típicas (LGPD): execução de contrato; legítimo interesse (segurança, melhoria); cumprimento de obrigação legal; consentimento quando exigido (ex.: comunicações opcionais).",
      ],
    },
    {
      title: "4. Com quem compartilhamos",
      paragraphs: [
        "Podemos compartilhar dados com: produtores do evento que você compra (dados necessários à venda, acesso e atendimento); provedores de pagamento; provedores de infraestrutura (hospedagem, e-mail, monitoramento), sob contrato; e autoridades, quando houver obrigação legal.",
        "Não vendemos seus dados pessoais.",
      ],
    },
    {
      title: "5. Cookies e tecnologias similares",
      paragraphs: [
        "Podemos usar cookies ou armazenamento local para sessão, preferências e segurança. Você pode controlar cookies no navegador; parte do site pode deixar de funcionar sem eles.",
      ],
    },
    {
      title: "6. Retenção",
      paragraphs: [
        "Mantemos os dados pelo tempo necessário às finalidades acima, à defesa de direitos e a obrigações legais (ex.: registros de compra). Depois, eliminamos ou anonimizamos, quando aplicável.",
      ],
    },
    {
      title: "7. Segurança",
      paragraphs: [
        "Adotamos medidas técnicas e organizacionais razoáveis (controle de acesso, hash de senha, comunicação segura). Nenhum sistema é 100% seguro; proteja suas credenciais.",
      ],
    },
    {
      title: "8. Seus direitos (LGPD)",
      paragraphs: [
        "Você pode solicitar: confirmação de tratamento, acesso, correção, anonimização/bloqueio/eliminação quando cabível, portabilidade, informação sobre compartilhamentos, revogação de consentimento e oposição, nos limites da lei.",
        "Peça por e-mail: contato@vibraevents.com.br. Também pode atualizar parte dos dados em Perfil.",
      ],
    },
    {
      title: "9. Menores",
      paragraphs: [
        "O serviço destina-se a pessoas com capacidade civil para contratar. Menores devem usar apenas com assistência ou consentimento do responsável, quando a lei exigir.",
      ],
    },
    {
      title: "10. Alterações",
      paragraphs: [
        "Podemos atualizar esta Política. A versão vigente fica publicada na plataforma, com data de atualização. Em mudanças relevantes, comunicaremos de forma adequada.",
      ],
    },
    {
      title: "11. Contato",
      paragraphs: [
        "Dúvidas sobre privacidade: contato@vibraevents.com.br.",
      ],
    },
  ],
};

export function getLegalDocument(id: LegalDocumentId): LegalDocument {
  return id === "terms" ? TERMS_OF_USE : PRIVACY_POLICY;
}
