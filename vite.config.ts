import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  resolve: {
    dedupe: ["react", "react-dom", "react/jsx-runtime"]
  },
  plugins: [
    react(),
    {
      name: "tauri-index-html",
      transformIndexHtml(html) {
        const bootstrapGuard = `<script>
window.__dfShowBootstrapError = function (message) {
  var root = document.getElementById("root");
  if (!root || root.childElementCount) return;
  root.innerHTML = '<pre style="margin:24px;padding:16px;border:1px solid #fee2e2;border-radius:8px;background:#fff1f2;color:#991b1b;font:13px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;">' + String(message).replace(/[&<>]/g, function (ch) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch]; }) + '</pre>';
};
window.addEventListener("error", function (event) {
  window.__dfShowBootstrapError(event.message || "Desktop bootstrap error");
});
window.addEventListener("unhandledrejection", function (event) {
  var reason = event.reason;
  window.__dfShowBootstrapError((reason && (reason.stack || reason.message)) || reason || "Unhandled bootstrap rejection");
});
setTimeout(function () {
  var root = document.getElementById("root");
  if (root && !root.childElementCount) window.__dfShowBootstrapError("Desktop bootstrap did not mount within 4s.");
}, 4000);
</script>`;
        return html.replaceAll(" crossorigin", "").replace("</head>", `${bootstrapGuard}</head>`);
      }
    }
  ],
  server: {
    port: 5174,
    strictPort: true
  }
});
