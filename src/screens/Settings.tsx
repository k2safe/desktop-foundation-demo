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
  if (status === "available" || status === "downloaded") return "success";
  if (status === "checking" || status === "downloading") return "info";
  if (status === "error") return "danger";
  return "neutral";
}

function formatCheckedAt(value?: number) {
  return value ? new Date(value).toLocaleTimeString() : "尚未检查";
}

function UpdateCenter({ client }: { client: DesktopClient }) {
  const [state, setState] = useState<AppUpdateState>(() => client.updates.getState());
  const [busyAction, setBusyAction] = useState<"check" | "download" | "install" | "page" | null>(null);
  const [message, setMessage] = useState("等待检查更新");

  function refresh(nextMessage?: string) {
    setState(client.updates.getState());
    if (nextMessage) setMessage(nextMessage);
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

  return (
    <div className="demo-update-center">
      <div className="demo-update-center__hero">
        <div>
          <div className="demo-update-center__eyebrow">Release channel</div>
          <h3>{update?.channel ?? "stable"}</h3>
          <p>{message}</p>
        </div>
        <Badge tone={statusTone(state.status)}>{state.status}</Badge>
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
          <span>最近检查</span>
          <strong>{formatCheckedAt(state.checkedAt)}</strong>
        </div>
        <div className="demo-update-stat">
          <span>下载路径</span>
          <strong>{state.downloadedPath ?? "-"}</strong>
        </div>
      </div>

      <div className="demo-update-center__actions">
        <Button size="sm" onClick={() => run("check", async () => {
          const result = await client.updates.checkForUpdate();
          refresh(result.available ? "发现新版本 " + result.update?.version : "当前已经是最新版本");
        })}>
          {busyAction === "check" ? "检查中" : "检查更新"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!update || busyAction === "download"}
          onClick={() => run("download", async () => {
            const result = await client.updates.downloadUpdate(update);
            refresh("已下载到 " + result.path);
          })}
        >
          {busyAction === "download" ? "下载中" : "下载更新"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!update || busyAction === "page"}
          onClick={() => run("page", async () => {
            await client.updates.openUpdatePage(update);
            refresh("已打开发布页");
          })}
        >
          发布页
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={!update || busyAction === "install"}
          onClick={() => run("install", async () => {
            await client.updates.installUpdate(update);
            refresh("安装请求已发送");
          })}
        >
          安装
        </Button>
      </div>

      <div className="demo-update-center__manifest">
        <div className="demo-update-center__manifest-title">Manifest Preview</div>
        <CodeBlock>{JSON.stringify(update ?? client.updates.getState(), null, 2)}</CodeBlock>
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
