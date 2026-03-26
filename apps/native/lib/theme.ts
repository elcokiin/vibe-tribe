export const THEME = {
  light: {
    background: "#ffffff",
    foreground: "#1a2a3d",
    muted: "#6b7a8f",
    danger: "#d3482a",
    success: "#2f9e44",
    accentForeground: "#ffffff",
  },
  dark: {
    background: "#25364b",
    foreground: "#f4f8ff",
    muted: "#a3b0c4",
    danger: "#f08a73",
    success: "#62c779",
    accentForeground: "#ffffff",
  },
};

export const NAV_THEME = {
  light: {
    dark: false,
    colors: {
      primary: THEME.light.foreground,
      background: THEME.light.background,
      card: THEME.light.background,
      text: THEME.light.foreground,
      border: "#e8edf3",
      notification: THEME.light.danger,
    },
  },
  dark: {
    dark: true,
    colors: {
      primary: THEME.dark.foreground,
      background: THEME.dark.background,
      card: THEME.dark.background,
      text: THEME.dark.foreground,
      border: "#556177",
      notification: THEME.dark.danger,
    },
  },
};

export function getThemeColors(isDark: boolean) {
  return isDark ? THEME.dark : THEME.light;
}
