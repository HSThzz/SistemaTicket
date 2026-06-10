import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box } from "@mantine/core";

interface AnimatedSectionProps {
  children: ReactNode;
  delayMs?: number;
  className?: string;
  /** Desliga fade-in (recomendado em fluxos funcionais como checkout). */
  animate?: boolean;
}

export function AnimatedSection({
  children,
  delayMs = 0,
  className,
  animate = true,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!animate) {
      setVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [animate]);

  const classNames = [
    animate ? "animate-in-view" : "",
    animate && visible ? "is-visible" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Box
      ref={ref}
      className={classNames}
      style={animate ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </Box>
  );
}
