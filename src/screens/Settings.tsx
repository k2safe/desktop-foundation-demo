import { useState } from "react";
import { Badge, Button, CodeBlock, EditableTable, SettingsPage, type EditableTableColumn } from "@desktop-foundation/ui-react";
import type { AppUpdateState, DesktopClient } from "@desktop-foundation/bridge";

interface RuntimeFlag {
  id: string;
  name: string;
  value: string;
  scope: string;
}

const columns: EditableTableColumn<RuntimeFlag>[] = [
  { key: "name", header: "配置项", accessor: "name", readOnly: true, minWidth: 180 },
  { key: "value", header: "值", accessor: "value" },
  {
    key: "scope",
    header: "范围",
    accessor: "scope",
    type: "select",
    options: [
      { value: "app", label: "app" },
      { value: "user", label: "user" },
      { value: "secure", label: "secure" }
    ],
    width: 160
  }
];

export interface SettingsProps {
  client: DesktopClient;
  logs: string[];
}

function statusTone(status: AppUpdateState["status"]) {
  if (status === "available" || status === "downloaded" || status === "installable" || status === "installed") return "success";
  if (status === "checking" || status === "downloading" || status === "installing") return "info";
  if (status === "error") return "danger";
  return "neutral";
}

function statusText(status: AppUpdateState["status"]) {
  const map: Record<AppUpdateState["status"], string> = {
    idle: "待检查",
    checking: "检查中",
    available: "可更新",
    "not-available": "已最新",
    downloading: "下载中",
    downloaded: "已下载",
    installable: "可安装",
    installing: "安装中",
    installed: "已安装",
    error: "异常"
  };
  return map[status];
}

function formatCheckedAt(value?: number) {
  return value ? new Date(value).toLocaleTimeString() : "尚未检查";
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "-";
}

function formatBytes(value?: number) {
  if (!value) return "-";
  if (value < 1024 * 1024) return Math.round(value / 1024) + " KB";
  return (value / 1024 / 1024).toFixed(2) + " MB";
}

function shortValue(value?: string) {
  if (!value) return "-";
  return value.length > 18 ? value.slice(0, 10) + "..." + value.slice(-6) : value;
}

function UpdateCenter({ client }: { client: DesktopClient }) {
  const [state, setState] = useState<AppUpdateState>(() => client.updates.getState());
  const [busyAction, setBusyAction] = useState<"check" | "download" | "install" | "page" | null>(null);
  const [message, setMessage] = useState("等待检查更新");

  function refresh(nextMessage?: string) {
    const nextState = client.updates.getState();
    setState(nextState);
    if (nextMessage) setMessage(nextMessage);
    else if (nextState.installMessage) setMessage(nextState.installMessage);
    else if (nextState.error) setMessage(nextState.error);
  }

  async function run(action: typeof busyAction, task: () => Promise<void>) {
    if (!action) return;
    setBusyAction(action);
    try {
      await task();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
      setState(client.updates.getState());
    } finally {
      setBusyAction(null);
    }
  }

  const update = state.update;
  const visibleMessage = state.error ?? state.installMessage ?? message;
  const manifestPreview = update
    ? {
        ...update,
        status: state.status,
        downloadedPath: state.downloadedPath,
        downloadedBytes: state.downloadedBytes,
        downloadedSha256: state.downloadedSha256,
        installMessage: state.installMessage,
        installedAt: state.installedAt
      }
    : client.updates.getState();

  return (
    <div className="demo-update-center">
      <div className="demo-update-center__hero">
        <div>
          <div className="demo-update-center__eyebrow">Release channel</div>
          <h3>{update?.channel ?? "stable"}</h3>
          <p>{visibleMessage}</p>
        </div>
        <Badge tone={statusTone(state.status)}>{statusText(state.status)}</Badge>
      </div>

      <div className="demo-update-center__stats">
        <div className="demo-update-stat">
          <span>当前版本</span>
          <strong>{state.currentVersion ?? "0.1.0"}</strong>
        </div>
        <div className="demo-update-stat">
          <span>可用版本</span>
          <strong>{update?.version ?? "-"}</strong>
        </div>
        <div className="demo-update-stat">
          <span>包大小</span>
          <strong>{formatBytes(update?.size ?? state.downloadedBytes)}</strong>
        </div>
        <div className="demo-update-stat">
          <span>最近检查</span>
          <strong>{formatCheckedAt(state.checkedAt)}</strong>
        </div>
        <div className="demo-update-stat">
          <span>发布时间</span>
          <strong>{formatDate(update?.pubDate)}</strong>
        </div>
        <div className="demo-update-stat">
          <span>Checksum</span>
          <strong>{shortValue(state.downloadedSha256 ?? update?.sha256)}</strong>
        </div>
      </div>

      <div className="demo-update-center__actions">
        <Button size="sm" disabled={busyAction !== null} onClick={() => run("check", async () => {
          const result = await client.updates.checkForUpdate();
          refresh(result.available ? "发现新版本 " + result.update?.version : "当前已经是最新版本");
        })}>
          {busyAction === "check" ? "检查中" : "检查更新"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!update || busyAction !== null}
          onClick={() => run("download", async () => {
            const result = await client.updates.downloadUpdate(update);
            refresh("已下载并校验：" + result.path);
          })}
        >
          {busyAction === "download" ? "下载中" : "下载更新"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!update || busyAction !== null}
          onClick={() => run("page", async () => {
            await client.updates.openUpdatePage(update);
            refresh("已打开发布页");
          })}
        >
          发布页
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!update || !state.downloadedPath || busyAction !== null}
          onClick={() => run("install", async () => {
            const result = await client.updates.installUpdate(update);
            refresh(result?.message ?? "安装请求已发送");
          })}
        >
          {busyAction === "install" ? "处理中" : "安装准备"}
        </Button>
      </div>

      <div className="demo-update-center__download">
        <span>下载路径</span>
        <strong>{state.downloadedPath ?? "等待下载"}</strong>
      </div>

      <div className="demo-update-center__manifest">
        <div className="demo-update-center__manifest-title">Manifest Preview</div>
        <CodeBlock>{JSON.stringify(manifestPreview, null, 2)}</CodeBlock>
      </div>
    </div>
  );
}

export function Settings({ client, logs }: SettingsProps) {
  const [activeSectionId, setActiveSectionId] = useState("runtime");
  const [flags, setFlags] = useState<RuntimeFlag[]>([
    { id: "api", name: "apiBaseURL", value: "https://api.foundation-demo.local", scope: "app" },
    { id: "token", name: "refreshToken", value: "secure-storage", scope: "secure" },
    { id: "density", name: "tableDensity", value: "default", scope: "user" }
  ]);

  return (
    <SettingsPage
      activeSectionId={activeSectionId}
      onSectionSelect={(section) => setActiveSectionId(section.id)}
      sections={[
        {
          id: "runtime",
          title: "运行时",
          description: "产品侧配置和底座 storage / secure storage 的边界示意。",
          content: (
            <EditableTable
              columns={columns}
              rows={flags}
              rowKey="id"
              onCellChange={(row, rowIndex, column, value) => {
                setFlags((current) => current.map((item, index) => (index === rowIndex && column.accessor ? { ...item, [column.accessor]: value } : item)));
                client.storage.set("settings." + row.id, value);
              }}
            />
          )
        },
        {
          id: "updates",
          title: "更新中心",
          description: "客户端只调用 client.updates，真实项目可替换为 GitHub Releases manifest 或 Tauri updater。",
          content: <UpdateCenter client={client} />
        },
        {
          id: "diagnostics",
          title: "诊断",
          description: "bridge 自动记录最近请求，产品可以直接接入 DebugPanel 或自定义诊断页。",
          content: <CodeBlock>{JSON.stringify(client.diagnostics.getRecentRequests(), null, 2)}</CodeBlock>
        },
        {
          id: "logs",
          title: "能力日志",
          description: "桌面能力调用记录。",
          content: <CodeBlock>{logs.join("\n") || "暂无调用记录。"}</CodeBlock>
        }
      ]}
    />
  );
}
