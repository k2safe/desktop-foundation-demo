import type { DesktopTheme } from "@desktop-foundation/ui-react";
import { adminThemePreset } from "@desktop-foundation/theme-presets";

export const demoProductTheme: DesktopTheme = {
  ...adminThemePreset,
  id: "demo-product",
  brand: { name: "Foundation Demo" },
  colors: {
    ...adminThemePreset.colors,
    danger: "#ef4444"
  }
};
