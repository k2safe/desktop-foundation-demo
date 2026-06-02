import "@desktop-foundation/ui-react/styles.css";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard, DebugPanel, DesktopAppShell, DesktopLoginPage, useSession } from "@desktop-foundation/app-shell";
import {
  Badge,
  Button,
  CommandPalette,
  DesktopLayout,
  LoadingBlock,
  SearchInput,
  Select,
  type CommandPaletteItem,
  type DesktopLayoutVariant,
  type DesktopMenuItem
} from "@desktop-foundation/ui-react";
import type { DesktopClient } from "@desktop-foundation/bridge";
import { createDemoProductClient, loginDemoUser } from "./client";
import { createMenus, demoUser, type DemoScreen } from "./data";
import { Dashboard } from "./screens/Dashboard";
import { Orders } from "./screens/Orders";
import { Settings } from "./screens/Settings";
import { createDemoProductTemplate, defaultThemeTemplateId, themeTemplateOptions, type ThemeTemplateId } from "./theme";

interface ProductWorkspaceProps {
  client: DesktopClient;
  logs: string[];
  themeTemplateId: ThemeTemplateId;
  layoutVariant: DesktopLayoutVariant;
  onThemeTemplateChange: (templateId: ThemeTemplateId) => void;
}

function ProductWorkspace({ client, logs, themeTemplateId, layoutVariant, onThemeTemplateChange }: ProductWorkspaceProps) {
  const session = useSession();
  const [screen, setScreen] = useState<DemoScreen>("dashboard");
  const [debugOpen, setDebugOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteValue, setPaletteValue] = useState("");

  const commands: CommandPaletteItem[] = [
    { id: "dashboard", label: "打开工作台", group: "导航" },
    { id: "orders", label: "打开订单中心", group: "导航" },
    { id: "settings", label: "打开底座设置", group: "导航" },
    { id: "notify", label: "发送测试通知", group: "桌面能力" },
    { id: "export", label: "导出订单 JSON", group: "文件能力" }
  ];

  function handleMenuSelect(item: DesktopMenuItem) {
    if (item.id === "dashboard" || item.id === "orders" || item.id === "settings") {
      setScreen(item.id);
    }
  }

  async function handleCommand(item: CommandPaletteItem) {
    if (item.id === "dashboard" || item.id === "orders" || item.id === "settings") setScreen(item.id);
    if (item.id === "notify") await client.desktop.notify({ title: "Foundation demo", body: "Command palette works." });
    if (item.id === "export") await client.files.exportJson("orders.json", [], { directory: "/tmp" });
    setPaletteOpen(false);
  }

  return (
    <>
      <DesktopLayout
        variant={layoutVariant}
        brand={{ name: "Foundation Demo" }}
        menus={createMenus(screen)}
        user={{ name: session.user?.name ?? demoUser.name, role: session.user?.role ?? demoUser.role }}
        topbarLeft={<SearchInput placeholder="全局搜索订单 / 商户 / 配置" />}
        topbarRight={
          <>
            <Badge tone="success">Desktop</Badge>
            <Select
              value={themeTemplateId}
              fullWidth={false}
              aria-label="皮肤模板"
              options={themeTemplateOptions}
              onChange={(event) => onThemeTemplateChange(event.target.value as ThemeTemplateId)}
            />
            <Button variant="outline" size="sm" onClick={() => setPaletteOpen(true)}>
              命令
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDebugOpen(true)}>
              Debug
            </Button>
          </>
        }
        onMenuSelect={handleMenuSelect}
        onLogout={session.clearSession}
      >
        {screen === "dashboard" ? <Dashboard client={client} logs={logs} onOpenCommands={() => setPaletteOpen(true)} /> : null}
        {screen === "orders" ? <Orders client={client} /> : null}
        {screen === "settings" ? <Settings client={client} logs={logs} /> : null}
      </DesktopLayout>
      <CommandPalette
        open={paletteOpen}
        items={commands}
        value={paletteValue}
        title="命令面板"
        placeholder="搜索命令"
        onValueChange={setPaletteValue}
        onSelect={(item) => void handleCommand(item)}
        onClose={() => setPaletteOpen(false)}
      />
      <DebugPanel open={debugOpen} onClose={() => setDebugOpen(false)} appVersion="0.1.0" environment="desktop-demo" />
    </>
  );
}

export function App() {
  const [logs, setLogs] = useState<string[]>([]);
  const [client, setClient] = useState<DesktopClient | null>(null);
  const [initError, setInitError] = useState<Error | null>(null);
  const [themeTemplateId, setThemeTemplateId] = useState<ThemeTemplateId>(defaultThemeTemplateId);
  const template = useMemo(() => createDemoProductTemplate(themeTemplateId), [themeTemplateId]);

  const pushLog = useMemo(
    () => (value: string) => {
      setLogs((current) => [`${new Date().toISOString()} ${value}`, ...current].slice(0, 10));
    },
    []
  );

  useEffect(() => {
    let mounted = true;
    void createDemoProductClient(pushLog)
      .then((nextClient) => {
        if (mounted) setClient(nextClient);
      })
      .catch((error) => {
        if (mounted) setInitError(error instanceof Error ? error : new Error("Failed to initialize desktop client"));
      });
    return () => {
      mounted = false;
    };
  }, [pushLog]);

  if (initError) {
    return <div style={{ padding: 24 }}>Failed to initialize demo: {initError.message}</div>;
  }

  if (!client) {
    return <div style={{ padding: 24 }}>Loading desktop foundation demo...</div>;
  }

  return (
    <DesktopAppShell
      theme={template.theme}
      className={template.className}
      client={client}
      session={{
        loadUser: async () => demoUser
      }}
    >
      <AuthGuard
        checkingFallback={<LoadingBlock rows={4} />}
        fallback={
          <DesktopLoginPage
            brand={{ name: "Foundation Demo" }}
            title="登录桌面 DEMO"
            variant={template.loginVariant}
            subtitle="账号和密码任意填写，用来演示 app-shell 的登录与 session 流程。"
            visualTitle="Desktop-first foundation."
            visualDescription="Tauri 环境走 Rust core，本地文件、通知、窗口和安全存储由底座统一接管。"
            submitLabel="进入 DEMO"
            login={{ login: loginDemoUser, defaultPayload: { account: "demo", password: "demo", remember: true } }}
          />
        }
      >
        <ProductWorkspace
          client={client}
          logs={logs}
          themeTemplateId={themeTemplateId}
          layoutVariant={template.layoutVariant}
          onThemeTemplateChange={setThemeTemplateId}
        />
      </AuthGuard>
    </DesktopAppShell>
  );
}
