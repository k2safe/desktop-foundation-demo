import type { DesktopLayoutVariant, DesktopTheme, LoginShellVariant } from "@desktop-foundation/ui-react";
import { createThemeTemplateRuntime, themeTemplates, type ThemeTemplateId } from "@desktop-foundation/theme-presets";

export type { ThemeTemplateId } from "@desktop-foundation/theme-presets";

export const defaultThemeTemplateId: ThemeTemplateId = "admin";

export const themeTemplateOptions = themeTemplates.map((template) => ({
  value: template.id,
  label: template.name
}));

export interface DemoProductTemplate {
  theme: DesktopTheme;
  className: string;
  layoutVariant: DesktopLayoutVariant;
  loginVariant: LoginShellVariant;
}

export function createDemoProductTemplate(templateId: ThemeTemplateId = defaultThemeTemplateId): DemoProductTemplate {
  const runtime = createThemeTemplateRuntime(templateId, {
    id: "demo-product",
    brand: { name: "Foundation Demo" },
    colors: {
      danger: "#ef4444"
    }
  });

  return {
    theme: runtime.theme,
    className: runtime.className,
    layoutVariant: runtime.layout.appShell,
    loginVariant: runtime.layout.login
  };
}

export function createDemoProductTheme(templateId: ThemeTemplateId = defaultThemeTemplateId): DesktopTheme {
  return createDemoProductTemplate(templateId).theme;
}

export const demoProductTheme: DesktopTheme = createDemoProductTheme();
