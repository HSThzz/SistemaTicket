export type Testimonial = {
  id: string;
  quote: string;
  author: string;
  location: string;
  avatarUrl: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "beta-fan",
    quote:
      "Finalmente uma plataforma que entende que show é experiência social — não só checkout.",
    author: "Fã beta",
    location: "São Paulo",
    avatarUrl: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: "rodrigo",
    quote:
      "Comprei meu ingresso em menos de 2 minutos. No PIX, sem surpresa de taxa na hora de pagar.",
    author: "Rodrigo M.",
    location: "Belo Horizonte",
    avatarUrl: "https://i.pravatar.cc/150?img=2",
  },
  {
    id: "camila",
    quote:
      "O feed de shows me fez descobrir artistas que eu nunca teria encontrado em outro lugar.",
    author: "Camila R.",
    location: "Rio de Janeiro",
    avatarUrl: "https://i.pravatar.cc/150?img=3",
  },
  {
    id: "lucas",
    quote:
      "4.9 de satisfação não é por acaso. Uso a VIBRA desde o beta e nunca tive problema nenhum.",
    author: "Lucas T.",
    location: "Curitiba",
    avatarUrl: "https://i.pravatar.cc/150?img=4",
  },
  {
    id: "juliana",
    quote:
      "O cashback foi o que me convenceu. Quando o show está em duas plataformas, sempre escolho a VIBRA.",
    author: "Juliana F.",
    location: "Porto Alegre",
    avatarUrl: "https://i.pravatar.cc/150?img=5",
  },
  {
    id: "felipe",
    quote:
      "Recebi meu ingresso digital na hora e o QR Code funcionou perfeitamente na entrada. Simples assim.",
    author: "Felipe A.",
    location: "Brasília",
    avatarUrl: "https://i.pravatar.cc/150?img=6",
  },
  {
    id: "mariana",
    quote:
      "Minhas amigas viram que eu ia num show pelo feed social e se juntaram na última hora. Incrível!",
    author: "Mariana S.",
    location: "Recife",
    avatarUrl: "https://i.pravatar.cc/150?img=7",
  },
  {
    id: "gabriel",
    quote:
      "87% de recompra faz todo sentido. Depois da VIBRA não consigo mais usar outra ticketeira.",
    author: "Gabriel N.",
    location: "Fortaleza",
    avatarUrl: "https://i.pravatar.cc/150?img=8",
  },
  {
    id: "beatriz",
    quote:
      "A plataforma recomendou um show baseado no que eu ouço no Spotify. Fui, amei, voltei fã.",
    author: "Beatriz L.",
    location: "Salvador",
    avatarUrl: "https://i.pravatar.cc/150?img=9",
  },
  {
    id: "andre",
    quote:
      "Taxa justa e ingresso na hora. É tudo que eu sempre quis de uma ticketeira. Por que demorou tanto?",
    author: "André P.",
    location: "Manaus",
    avatarUrl: "https://i.pravatar.cc/150?img=10",
  },
];

export const TESTIMONIAL_STATS = [
  { value: "4.9", label: "satisfação média" },
  { value: "87%", label: "recompram" },
  { value: "< 2 min", label: "para comprar" },
] as const;
