import { NAV_THEME, THEME, getThemeColors } from "@/lib/theme";

describe("theme", () => {
  it("returns light palette when isDark is false", () => {
    expect(getThemeColors(false)).toEqual(THEME.light);
  });

  it("returns dark palette when isDark is true", () => {
    expect(getThemeColors(true)).toEqual(THEME.dark);
  });

  it("has navigation themes aligned to dark flag", () => {
    expect(NAV_THEME.light.dark).toBe(false);
    expect(NAV_THEME.dark.dark).toBe(true);
  });
});
