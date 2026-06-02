import "@desktop-foundation/ui-react/styles.css";
import "./App.css";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard, DebugPanel, DesktopAppShell, DesktopLoginPage, useSession } from "@desktop-foundation/app-shell";
import {
  Badge,
  Button,
  CommandPalette,
  DesktopLayout,
  Input,
  LoadingBlock,
  Modal,
  SearchInput,
  Select,
  type CommandPaletteItem,
  type DesktopLayoutVariant,
  type DesktopMenuItem
} from "@desktop-foundation/ui-react";
import type { DesktopClient } from "@desktop-foundation/bridge";
import { createDemoProductClient, loginDemoUser } from "./client";
import { createMenus, demoUser, type DemoScreen, type DemoUser } from "./data";
import { Dashboard } from "./screens/Dashboard";
import { Orders } from "./screens/Orders";
import { Settings } from "./screens/Settings";
import { createDemoProductTemplate, defaultThemeTemplateId, themeTemplateOptions, type ThemeTemplateId } from "./theme";

const appBrand = "Commerce Ops";

interface ProductWorkspaceProps {
  client: DesktopClient;
  logs: string[];
  themeTemplateId: ThemeTemplateId;
  layoutVariant: DesktopLayoutVariant;
  onThemeTemplateChange: (templateId: ThemeTemplateId) => void;
}

function ProductWorkspace({ client, logs, themeTemplateId, layoutVariant, onThemeTemplateChange }: ProductWorkspaceProps) {
  const session = useSession<DemoUser>();
  const [screen, setScreen] = useState<DemoScreen>("dashboard");
  const [debugOpen, setDebugOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteValue, setPaletteValue] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState({ name: demoUser.name, account: demoUser.account, role: demoUser.role });
  const [profileDraft, setProfileDraft] = useState(profile);

  useEffect(() => {
    const nextProfile = {
      name: session.user?.name ?? demoUser.name,
      account: session.user?.account ?? demoUser.account,
      role: session.user?.role ?? demoUser.role
    };
    setProfile(nextProfile);
    setProfileDraft(nextProfile);
  }, [session.user?.account, session.user?.name, session.user?.role]);

  const commands: CommandPaletteItem[] = [
    { id: "dashboard", label: "打开工作台", group: "导航" },
    { id: "orders", label: "打开商城订单", group: "导航" },
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
    if (item.id === "notify") await client.desktop.notify({ title: "Commerce demo", body: "Command palette works." });
    if (item.id === "export") await client.files.exportJson("orders.json", [], { directory: "/tmp" });
    setPaletteOpen(false);
  }

  function handleOpenProfile() {
    setProfileDraft(profile);
    setProfileOpen(true);
  }

  function handleSaveProfile() {
    setProfile(profileDraft);
    setProfileOpen(false);
  }

  return (
    <>
      <DesktopLayout
        variant={layoutVariant}
        brand={{ name: appBrand }}
        menus={createMenus(screen)}
        user={{ name: profile.name, account: profile.account, role: profile.role }}
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
        onEditProfile={handleOpenProfile}
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
      <Modal
        open={profileOpen}
        className="df-modal--compact demo-profile-modal"
        title="个人信息"
        onClose={() => setProfileOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setProfileOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveProfile}>保存</Button>
          </>
        }
      >
        <div className="demo-profile-card">
          <div className="demo-profile-card__hero">
            <span className="demo-profile-card__avatar">{(profileDraft.name || profileDraft.account || "D").slice(0, 1).toUpperCase()}</span>
            <span className="demo-profile-card__identity">
              <strong>{profileDraft.name || "Store Admin"}</strong>
              <span>{profileDraft.role || "Commerce Ops"}</span>
            </span>
          </div>
          <div className="demo-profile-card__form">
            <Input
              label="姓名"
              value={profileDraft.name}
              onChange={(event) => setProfileDraft((current) => ({ ...current, name: event.target.value }))}
            />
            <Input
              label="账号"
              value={profileDraft.account}
              onChange={(event) => setProfileDraft((current) => ({ ...current, account: event.target.value }))}
            />
            <Input
              label="角色"
              value={profileDraft.role}
              onChange={(event) => setProfileDraft((current) => ({ ...current, role: event.target.value }))}
            />
          </div>
        </div>
      </Modal>
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
    return <div style={{ padding: 24 }}>Failed to initialize commerce demo: {initError.message}</div>;
  }

  if (!client) {
    return <div style={{ padding: 24 }}>Loading commerce desktop demo...</div>;
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
            brand={{ name: appBrand }}
            title="商城运营登录"
            variant={template.loginVariant}
            subtitle="输入任意账号密码即可进入，用来演示商城后台的登录、会话和桌面能力接入。"
            visualTitle="Commerce operations, on desktop."
            visualDescription="订单、库存、报表和更新中心跑在同一个桌面底座里，业务只维护自己的页面和数据。"
            submitLabel="进入工作台"
            login={{ login: loginDemoUser, defaultPayload: { account: "store-admin", password: "demo", remember: true } }}
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
