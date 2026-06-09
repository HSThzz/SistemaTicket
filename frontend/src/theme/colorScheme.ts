import { localStorageColorSchemeManager } from "@mantine/core";

export const COLOR_SCHEME_STORAGE_KEY = "vibra-color-scheme";

export const colorSchemeManager = localStorageColorSchemeManager({
  key: COLOR_SCHEME_STORAGE_KEY,
});
