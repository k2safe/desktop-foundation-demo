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

## Foundation Consumption

This repo consumes foundation as an external product project:

- JavaScript packages come from GitHub raw tarballs listed in `desktop-foundation/artifacts/npm/foundation-packages.json`.
- `pnpm.overrides` pins transitive foundation package dependencies to the same tarball URLs.
- `desktop-core-rs` comes from `git@github.com:k2safe/desktop-foundation.git` via SSH and is pinned to a foundation commit.

When the foundation packages are published to npm or GitHub Packages, these URL specs can be replaced with normal semver ranges.

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
