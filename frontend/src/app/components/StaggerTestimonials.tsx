import { useMediaQuery } from "@mantine/hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  TESTIMONIAL_STATS,
  TESTIMONIALS,
  type Testimonial,
} from "./testimonials.data";

const AUTOPLAY_MS = 6000;
const DESKTOP_OFFSETS = [-2, -1, 0, 1, 2] as const;
const MOBILE_OFFSETS = [-1, 0, 1] as const;

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function testimonialAt(index: number, offset: number): Testimonial {
  return TESTIMONIALS[mod(index + offset, TESTIMONIALS.length)];
}

type TestimonialCardProps = {
  offset: number;
  testimonial: Testimonial;
  onSelect: (offset: number) => void;
};

function TestimonialCard({
  offset,
  testimonial,
  onSelect,
}: TestimonialCardProps) {
  const isActive = offset === 0;

  return (
    <article
      className={`stagger-testimonials__card${isActive ? " stagger-testimonials__card--active" : ""}`}
      data-position={offset}
      aria-hidden={!isActive}
      aria-roledescription="slide"
      onClick={() => {
        if (!isActive) onSelect(offset);
      }}
    >
      <img
        className="stagger-testimonials__avatar"
        src={testimonial.avatarUrl}
        alt=""
        loading="lazy"
        decoding="async"
      />
      <blockquote className="stagger-testimonials__quote">
        <p>&ldquo;{testimonial.quote}&rdquo;</p>
      </blockquote>
      <footer className="stagger-testimonials__author">
        <cite>
          {testimonial.author}, {testimonial.location}
        </cite>
      </footer>
    </article>
  );
}

export function StaggerTestimonials() {
  const isDesktop = useMediaQuery("(min-width: 40em)");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);

  const offsets = isDesktop ? DESKTOP_OFFSETS : MOBILE_OFFSETS;
  const activeTestimonial = TESTIMONIALS[activeIndex];

  const goTo = useCallback((delta: number) => {
    setActiveIndex((current) => mod(current + delta, TESTIMONIALS.length));
  }, []);

  const goToOffset = useCallback(
    (offset: number) => {
      if (offset === 0) return;
      goTo(offset);
    },
    [goTo],
  );

  useEffect(() => {
    if (isPaused) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const timer = window.setInterval(() => goTo(1), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [goTo, isPaused]);

  useEffect(() => {
    const region = regionRef.current;
    if (!region) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(1);
      }
    };

    region.addEventListener("keydown", onKeyDown);
    return () => region.removeEventListener("keydown", onKeyDown);
  }, [goTo]);

  return (
    <section
      className="stagger-testimonials"
      aria-labelledby="stagger-testimonials-title"
      aria-describedby="stagger-testimonials-stats"
    >
      <header className="stagger-testimonials__header">
        <p className="stagger-testimonials__kicker">Depoimentos</p>
        <h2
          id="stagger-testimonials-title"
          className="stagger-testimonials__title"
        >
          Amado por quem vive música.
        </h2>
        <ul
          id="stagger-testimonials-stats"
          className="stagger-testimonials__stats"
        >
          {TESTIMONIAL_STATS.map((stat) => (
            <li key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </li>
          ))}
        </ul>
      </header>

      <div
        ref={regionRef}
        className="stagger-testimonials__stage"
        role="region"
        aria-roledescription="carrossel"
        aria-label="Depoimentos de fãs"
        tabIndex={0}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsPaused(false);
          }
        }}
      >
        {/* <ActionIcon
          className="stagger-testimonials__nav stagger-testimonials__nav--prev"
          variant="subtle"
          size="xl"
          radius="xl"
          aria-label="Depoimento anterior"
          onClick={() => goTo(-1)}
        >
          <IconChevronLeft size={22} stroke={2} />
        </ActionIcon> */}

        <div className="stagger-testimonials__track" aria-live="polite">
          {offsets.map((offset) => (
            <TestimonialCard
              key={offset}
              offset={offset}
              testimonial={testimonialAt(activeIndex, offset)}
              onSelect={goToOffset}
            />
          ))}
        </div>

        {/* <ActionIcon
          className="stagger-testimonials__nav stagger-testimonials__nav--next"
          variant="subtle"
          size="xl"
          radius="xl"
          aria-label="Próximo depoimento"
          onClick={() => goTo(1)}
        >
          <IconChevronRight size={22} stroke={2} />
        </ActionIcon> */}
      </div>

      <p className="stagger-testimonials__sr-only" aria-live="polite">
        Depoimento {activeIndex + 1} de {TESTIMONIALS.length}:{" "}
        {activeTestimonial.author}, {activeTestimonial.location}
      </p>

      {/* <div
        className="stagger-testimonials__dots"
        role="tablist"
        aria-label="Escolher depoimento"
      >
        {TESTIMONIALS.map((testimonial, index) => (
          <UnstyledButton
            key={testimonial.id}
            className={`stagger-testimonials__dot${index === activeIndex ? " stagger-testimonials__dot--active" : ""}`}
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={`Depoimento ${index + 1}: ${testimonial.author}`}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div> */}
    </section>
  );
}
