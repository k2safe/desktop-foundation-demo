# Desktop Foundation Demo

Standalone Tauri product-style demo for `desktop-foundation`.

This repository is intentionally separate from the foundation monorepo. It demonstrates how a real desktop product consumes foundation packages for:

- Tauri desktop shell backed by `desktop-core-rs`
- app shell, login, session, debug panel
- desktop layout and reusable UI components
- theme presets and product theme overrides
- bridge client, storage, secure storage, files, notification, clipboard, diagnostics

## Repositories

- Foundation: `k2safe/desktop-foundation`
- Demo: `k2safe/desktop-foundation-demo`

## Desktop First

`pnpm dev` launches the Tauri desktop app. `pnpm dev:web` is only a browser preview fallback for quick UI iteration.

The demo keeps business HTTP mocked so it does not need a backend. In Tauri runtime, desktop capabilities are wired through the foundation Rust command contract:

- window state/title
- external open
- clipboard
- notification
- file dialog/export/download
- session/storage/secure storage

## Local Development Before Package Release

The dependencies use normal package versions, for example `@desktop-foundation/ui-react`: `0.1.0`.

For local development before publishing packages, `package.json` includes `pnpm.overrides` that link to a sibling checkout at `../desktop-foundation/packages/*`. The Tauri crate also uses a local path to `../desktop-foundation/packages/desktop-core-rs`.

After publishing the foundation packages/crate, remove the local overrides/path dependencies and install from the registry.

## Scripts

```bash
pnpm install
pnpm dev
pnpm dev:web
pnpm type-check
pnpm build
pnpm check:desktop
pnpm build:desktop
```

## Demo Account

Any account and password works. The login flow is mocked to show how `DesktopAppShell`, `DesktopLoginPage`, and session state fit together.
