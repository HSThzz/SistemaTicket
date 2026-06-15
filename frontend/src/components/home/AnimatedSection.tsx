import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box } from "@mantine/core";

interface AnimatedSectionProps {
  children: ReactNode;
  delayMs?: number;
  className?: string;
  /** Desliga fade-in (recomendado em fluxos funcionais como checkout). */
  animate?: boolean;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isInViewport(node: HTMLElement): boolean {
  const rect = node.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}

export function AnimatedSection({
  children,
  delayMs = 0,
  className,
  animate = true,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!animate || prefersReducedMotion());

  useEffect(() => {
    if (!animate || prefersReducedMotion()) {
      setVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) {
      return;
    }

    if (isInViewport(node)) {
      setVisible(true);
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const fallbackTimer = window.setTimeout(() => {
      setVisible(true);
    }, 1200);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
          window.clearTimeout(fallbackTimer);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px 0px 0px" },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallbackTimer);
    };
  }, [animate]);

  const classNames = [
    animate && !prefersReducedMotion() ? "animate-in-view" : "",
    animate && visible ? "is-visible" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Box
      ref={ref}
      className={classNames}
      style={animate && visible ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </Box>
  );
}
