export const COLOR_SCHEMES = [
  { id: "forest", label: "Forest" },
  { id: "navy", label: "Navy" },
  { id: "maroon", label: "Maroon" },
] as const;

export const COLOR_MODES = ["dark", "light"] as const;

export type ColorScheme = (typeof COLOR_SCHEMES)[number]["id"];

export type ColorMode = (typeof COLOR_MODES)[number];

export interface Theme {
  scheme: ColorScheme;
  mode: ColorMode;
}

export const DEFAULT_THEME: Theme = { scheme: "forest", mode: "dark" };

export const THEME_STORAGE_KEY = "debate-coach-theme";
