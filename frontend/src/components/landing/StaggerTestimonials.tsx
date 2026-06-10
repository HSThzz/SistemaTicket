import React, { useState, useEffect } from "react";

const SQRT_5000 = Math.sqrt(5000);

const testimonials = [
  {
    tempId: 0,
    testimonial:
      "Finalmente uma plataforma que entende que show é experiência social — não só checkout.",
    by: "Fã beta, São Paulo",
    imgSrc: "https://i.pravatar.cc/150?img=1",
  },
  {
    tempId: 1,
    testimonial:
      "Comprei meu ingresso em menos de 2 minutos. No PIX, sem surpresa de taxa na hora de pagar.",
    by: "Rodrigo M., Belo Horizonte",
    imgSrc: "https://i.pravatar.cc/150?img=2",
  },
  {
    tempId: 2,
    testimonial:
      "O feed de shows me fez descobrir artistas que eu nunca teria encontrado em outro lugar.",
    by: "Camila R., Rio de Janeiro",
    imgSrc: "https://i.pravatar.cc/150?img=3",
  },
  {
    tempId: 3,
    testimonial:
      "4.9 de satisfação não é por acaso. Uso a VIBRA desde o beta e nunca tive problema nenhum.",
    by: "Lucas T., Curitiba",
    imgSrc: "https://i.pravatar.cc/150?img=4",
  },
  {
    tempId: 4,
    testimonial:
      "O cashback foi o que me convenceu. Quando o show está em duas plataformas, sempre escolho a VIBRA.",
    by: "Juliana F., Porto Alegre",
    imgSrc: "https://i.pravatar.cc/150?img=5",
  },
  {
    tempId: 5,
    testimonial:
      "Recebi meu ingresso digital na hora e o QR Code funcionou perfeitamente na entrada. Simples assim.",
    by: "Felipe A., Brasília",
    imgSrc: "https://i.pravatar.cc/150?img=6",
  },
  {
    tempId: 6,
    testimonial:
      "Minhas amigas viram que eu ia num show pelo feed social e se juntaram na última hora. Incrível!",
    by: "Mariana S., Recife",
    imgSrc: "https://i.pravatar.cc/150?img=7",
  },
  {
    tempId: 7,
    testimonial:
      "87% de recompra faz todo sentido. Depois da VIBRA não consigo mais usar outra ticketeira.",
    by: "Gabriel N., Fortaleza",
    imgSrc: "https://i.pravatar.cc/150?img=8",
  },
  {
    tempId: 8,
    testimonial:
      "A plataforma recomendou um show baseado no que eu ouço no Spotify. Fui, amei, voltei fã.",
    by: "Beatriz L., Salvador",
    imgSrc: "https://i.pravatar.cc/150?img=9",
  },
  {
    tempId: 9,
    testimonial:
      "Taxa justa e ingresso na hora. É tudo que eu sempre quis de uma ticketeira. Por que demorou tanto?",
    by: "André P., Manaus",
    imgSrc: "https://i.pravatar.cc/150?img=10",
  },
];

interface TestimonialCardProps {
  position: number;
  testimonial: (typeof testimonials)[0];
  handleMove: (steps: number) => void;
  cardSize: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  position,
  testimonial,
  handleMove,
  cardSize,
}) => {
  const isCenter = position === 0;

  return (
    <div
      onClick={() => handleMove(position)}
      style={{
        position: "absolute",
        left: "50%",
        top: "calc(50% + 40px)",
        cursor: "pointer",
        width: cardSize,
        height: cardSize,
        padding: "2.25rem 2rem 5rem",
        border: `2px solid ${isCenter ? "var(--vibra-v)" : "var(--mantine-color-default-border)"}`,
        background: isCenter ? "var(--vibra-v)" : "var(--vibra-surface)",
        color: isCenter ? "#ffffff" : "var(--mantine-color-text)",
        zIndex: isCenter ? 10 : 0,
        transition: "all 0.5s ease-in-out",
        clipPath:
          "polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)",
        transform: `
          translate(-50%, -50%)
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
        boxShadow: isCenter
          ? `0px 8px 0px 4px var(--mantine-color-default-border)`
          : "0px 0px 0px 0px transparent",
      }}
    >
      <span
        style={{
          position: "absolute",
          display: "block",
          transformOrigin: "top right",
          transform: "rotate(45deg)",
          background: "var(--mantine-color-default-border)",
          right: -2,
          top: 48,
          width: SQRT_5000,
          height: 2,
        }}
      />
      <img
        src={testimonial.imgSrc}
        alt={testimonial.by.split(",")[0]}
        style={{
          display: "block",
          marginBottom: "1rem",
          height: 56,
          width: 48,
          objectFit: "cover",
          objectPosition: "top",
          background: "var(--vibra-surface-muted)",
          boxShadow: `3px 3px 0px var(--mantine-color-body)`,
        }}
      />
      <h3
        style={{
          fontSize: "clamp(0.85rem, 1.5vw, 1.1rem)",
          fontWeight: 500,
          margin: 0,
          color: isCenter ? "#ffffff" : "var(--mantine-color-text)",
          fontFamily: "inherit",
          lineHeight: 1.4,
        }}
      >
        "{testimonial.testimonial}"
      </h3>
      <p
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "2rem",
          right: "2rem",
          margin: 0,
          fontSize: "0.82rem",
          fontStyle: "italic",
          color: isCenter ? "rgba(255,255,255,0.8)" : "var(--mantine-color-dimmed)",
        }}
      >
        — {testimonial.by}
      </p>
    </div>
  );
};

export const StaggerTestimonials: React.FC = () => {
  const [cardSize, setCardSize] = useState(365);
  const [testimonialsList, setTestimonialsList] = useState(testimonials);

  const handleMove = (steps: number) => {
    const newList = [...testimonialsList];
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = newList.shift();
        if (!item) return;
        newList.push({ ...item, tempId: Math.random() });
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = newList.pop();
        if (!item) return;
        newList.unshift({ ...item, tempId: Math.random() });
      }
    }
    setTestimonialsList(newList);
  };

  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia("(min-width: 640px)");
      setCardSize(matches ? 365 : 290);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        background: "var(--mantine-color-body)",
        height: 720,
        borderTop: "1px solid var(--mantine-color-default-border)",
        borderBottom: "1px solid var(--mantine-color-default-border)",
      }}
    >
      <p
        style={{
          position: "absolute",
          top: "2.75rem",
          left: 0,
          right: 0,
          textAlign: "center",
          margin: 0,
          fontFamily: "var(--vibra-font-display)",
          fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          color: "var(--mantine-color-text)",
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        Amado por quem vive música.
      </p>

      {testimonialsList.map((testimonial, index) => {
        const position =
          testimonialsList.length % 2
            ? index - (testimonialsList.length + 1) / 2
            : index - testimonialsList.length / 2;
        return (
          <TestimonialCard
            key={testimonial.tempId}
            testimonial={testimonial}
            handleMove={handleMove}
            position={position}
            cardSize={cardSize}
          />
        );
      })}
    </div>
  );
};
