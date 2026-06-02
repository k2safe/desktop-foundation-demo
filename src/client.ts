import {
  createDesktopClient,
  createTauriDesktopCapability,
  createTauriFileCapability,
  createTauriKeyValueStore,
  createTauriSecureStorage,
  createTauriSessionStore,
  createWebFileCapability,
  type AsyncKeyValueStore,
  type DesktopCapability,
  type DesktopClient,
  type FileCapability,
  type HttpTransport,
  type HttpTransportRequest,
  type KeyValueStore,
  type SessionStore
} from "@desktop-foundation/bridge";
import { invoke } from "@tauri-apps/api/core";
import { demoUser, orders, type DemoUser } from "./data";

const product = "demo-product";
const demoVersion = (import.meta.env.VITE_APP_VERSION as string | undefined)?.trim() || "0.1.0";
const apiBaseURL = "https://api.foundation-demo.local";

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function memoryStore(initialValues: Record<string, unknown> = {}): KeyValueStore {
  const values = new Map<string, unknown>(Object.entries(initialValues));
  return {
    get: <T,>(key: string) => (values.has(key) ? (values.get(key) as T) : null),
    set: (key, value) => {
      values.set(key, value);
    },
    remove: (key) => {
      values.delete(key);
    }
  };
}

function memorySecureStore(): AsyncKeyValueStore {
  const values = new Map<string, unknown>();
  return {
    async get<T>(key: string) {
      return values.has(key) ? (values.get(key) as T) : null;
    },
    async set(key, value) {
      values.set(key, value);
    },
    async remove(key) {
      values.delete(key);
    }
  };
}

function demoSessionStore(): SessionStore {
  let token: string | null = null;
  return {
    getToken: () => token,
    setToken: (nextToken) => {
      token = nextToken;
    },
    clearToken: () => {
      token = null;
    }
  };
}

function demoTransport(): HttpTransport {
  return {
    async request<T>(request: HttpTransportRequest) {
      if (request.url.endsWith("/auth/login")) {
        const payload = request.body as { account?: string; password?: string; remember?: boolean };
        if (!payload.account || !payload.password) throw new Error("Account and password are required");
        return { token: "demo-token", remember: payload.remember, user: demoUser } as T;
      }
      if (request.url.endsWith("/me")) return demoUser as T;
      if (request.url.endsWith("/orders")) return { rows: orders, total: orders.length } as T;
      return { ok: true, method: request.method, url: request.url, requestId: request.requestId } as T;
    }
  };
}

function demoDesktopCapability(pushLog: (value: string) => void): DesktopCapability {
  return {
    async openExternal(url) {
      pushLog(`openExternal ${url}`);
    },
    async copyText(text) {
      pushLog(`copyText ${text}`);
    },
    async notify(options) {
      pushLog(`notify ${options.title}`);
    },
    async getWindowState() {
      return { x: 80, y: 80, width: 1280, height: 820, maximized: false, fullscreen: false };
    },
    async setWindowState(state) {
      pushLog(`setWindowState ${JSON.stringify(state)}`);
    },
    async setWindowTitle(title) {
      pushLog(`setWindowTitle ${title}`);
    }
  };
}

function demoFileCapability(pushLog: (value: string) => void): FileCapability {
  return {
    async openFileDialog() {
      pushLog("openFileDialog");
      return { paths: ["/tmp/foundation-demo.csv"], canceled: false };
    },
    async saveFileDialog() {
      pushLog("saveFileDialog");
      return { path: "/tmp/foundation-export.json", canceled: false };
    },
    async readTextFile(path) {
      pushLog(`readTextFile ${path}`);
      return "id,merchant,amount";
    },
    async writeTextFile(path) {
      pushLog(`writeTextFile ${path}`);
      return path;
    },
    async exportJson(fileName) {
      pushLog(`exportJson ${fileName}`);
      return `/tmp/${fileName}`;
    },
    async downloadFile(url) {
      pushLog(`downloadFile ${url}`);
      return { path: "/tmp/foundation-report.csv", bytes: 2048, status: 200 };
    }
  };
}

function envValue(name: string) {
  return (import.meta.env[name] as string | undefined)?.trim();
}

function updateManifestUrl() {
  return envValue("VITE_UPDATE_MANIFEST_URL") || new URL("./updates/latest.json", window.location.href).toString();
}

function isLocalUpdateFixture() {
  return !envValue("VITE_UPDATE_MANIFEST_URL");
}

function shouldVerifyUpdateChecksum() {
  return isLocalUpdateFixture() || envValue("VITE_UPDATE_REQUIRE_CHECKSUM") === "1";
}

function shouldUseWebUpdateDownloads() {
  return isLocalUpdateFixture() || envValue("VITE_UPDATE_DOWNLOAD_MODE") === "web";
}

function demoUpdateConfig() {
  return {
    currentVersion: demoVersion,
    manifestUrl: updateManifestUrl(),
    channel: envValue("VITE_UPDATE_CHANNEL") || "stable",
    requireChecksumVerification: shouldVerifyUpdateChecksum()
  };
}

function isUpdateDownloadUrl(url: string) {
  if (isLocalUpdateFixture()) return url.startsWith("./updates/") || url.startsWith("/updates/") || url.includes("/updates/");
  return shouldUseWebUpdateDownloads() && (url.startsWith("https://") || url.startsWith("http://"));
}

function withUpdateDownloads(files: FileCapability): FileCapability {
  const webFiles = createWebFileCapability();
  return {
    ...files,
    downloadFile: (url, options) => (isUpdateDownloadUrl(url) ? webFiles.downloadFile(url, options) : files.downloadFile(url, options))
  };
}

export async function createDemoProductClient(pushLog: (value: string) => void): Promise<DesktopClient> {
  if (isTauriRuntime()) {
    const session = await createTauriSessionStore(invoke, product);
    const desktop = createTauriDesktopCapability(invoke);
    const files = withUpdateDownloads(createTauriFileCapability(invoke, product));
    return createDesktopClient({
      product,
      apiBaseURL,
      session,
      storage: createTauriKeyValueStore(invoke, product, "user", { "orders.density": "default" }),
      secureStorage: createTauriSecureStorage(invoke, product),
      transport: demoTransport(),
      desktop,
      files,
      version: demoVersion,
      updateConfig: demoUpdateConfig(),
      security: {
        allowedRequestOrigins: ["api.foundation-demo.local", "localhost", "127.0.0.1", "github.com", "raw.githubusercontent.com", "objects.githubusercontent.com", "github-releases.githubusercontent.com"],
        allowedExternalOrigins: ["github.com", "docs.example.com"],
        allowedExternalSchemes: ["https"],
        allowedDownloadDirectories: ["/tmp"]
      }
    });
  }

  const desktop = demoDesktopCapability(pushLog);
  const files = withUpdateDownloads(demoFileCapability(pushLog));

  return createDesktopClient({
    product,
    apiBaseURL,
    session: demoSessionStore(),
    storage: memoryStore({ "orders.density": "default" }),
    secureStorage: memorySecureStore(),
    transport: demoTransport(),
    desktop,
    files,
    version: demoVersion,
    updateConfig: demoUpdateConfig(),
    security: {
      allowedRequestOrigins: ["api.foundation-demo.local", "localhost", "127.0.0.1", "github.com", "raw.githubusercontent.com", "objects.githubusercontent.com", "github-releases.githubusercontent.com"],
      allowedExternalOrigins: ["github.com", "docs.example.com"],
      allowedExternalSchemes: ["https"],
      allowedDownloadDirectories: ["/tmp"]
    }
  });
}

export async function loginDemoUser(client: DesktopClient, payload: { account: string; password: string; remember?: boolean }) {
  return client.http.post<{ token: string; user: DemoUser; remember?: boolean }>("/auth/login", payload, { auth: false });
}
