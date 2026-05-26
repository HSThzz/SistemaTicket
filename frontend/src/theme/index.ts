import { createTheme, type MantineColorsTuple } from "@mantine/core";

const brand: MantineColorsTuple = [
  "#f0f4ff",
  "#dce4ff",
  "#b8c9ff",
  "#8fa8ff",
  "#6688f5",
  "#4a6fe8",
  "#3d5fd4",
  "#354fb8",
  "#2f4594",
  "#283d75",
];

export const appTheme = createTheme({
  primaryColor: "brand",
  colors: {
    brand,
  },
  fontFamily:
    '"Plus Jakarta Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily:
      '"Plus Jakarta Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: "700",
  },
  defaultRadius: "md",
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
        radius: "md",
      },
    },
    Paper: {
      defaultProps: {
        radius: "md",
        shadow: "sm",
      },
    },
  },
});
