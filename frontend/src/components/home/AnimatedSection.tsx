import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box } from "@mantine/core";

interface AnimatedSectionProps {
  children: ReactNode;
  delayMs?: number;
  className?: string;
}

export function AnimatedSection({ children, delayMs = 0, className }: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
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
  }, []);

  return (
    <Box
      ref={ref}
      className={`animate-in-view ${visible ? "is-visible" : ""} ${className ?? ""}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {children}
    </Box>
  );
}
