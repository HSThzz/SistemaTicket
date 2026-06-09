import { createTheme, type MantineColorsTuple } from "@mantine/core";

const brand: MantineColorsTuple = [
  "#e8f5e8",
  "#c8f0c8",
  "#9ee89e",
  "#78e078",
  "#5cd65c",
  "#4ADE80",
  "#22C55E",
  "#16A34A",
  "#15803D",
  "#052e16",
];

export const appTheme = createTheme({
  primaryColor: "brand",
  colors: {
    brand,
  },
  fontFamily:
    '"DM Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily: '"Unbounded", "DM Sans", sans-serif',
    fontWeight: "900",
  },
  defaultRadius: "sm",
  components: {
    AppShell: {
      styles: {
        root: {
          backgroundColor: "var(--mantine-color-body)",
        },
        header: {
          backgroundColor: "var(--mantine-color-body)",
          borderBottom: "1px solid var(--mantine-color-default-border)",
          width: "100%",
        },
        navbar: {
          backgroundColor: "var(--mantine-color-body)",
          borderRight: "1px solid var(--mantine-color-default-border)",
        },
        main: {
          backgroundColor: "var(--mantine-color-body)",
          width: "100%",
          maxWidth: "none",
        },
      },
    },
    Button: {
      defaultProps: {
        radius: "xl",
      },
    },
    Paper: {
      defaultProps: {
        radius: "sm",
        shadow: "sm",
      },
    },
    Badge: {
      defaultProps: {
        radius: "xl",
      },
    },
  },
});
