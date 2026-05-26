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
    'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily:
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: "700",
  },
  defaultRadius: "md",
  components: {
    AppShell: {
      styles: {
        main: {
          backgroundColor: "var(--mantine-color-body)",
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
